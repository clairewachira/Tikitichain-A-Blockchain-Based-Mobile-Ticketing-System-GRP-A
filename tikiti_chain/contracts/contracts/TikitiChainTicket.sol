// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TikitiChainTicket
 * @dev NFT-based event ticketing system with resale control and royalties
 */
contract TikitiChainTicket is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Event structure
    struct Event {
        string eventId;           // Supabase event ID
        address organizer;        // Event organizer address
        uint256 price;           // Ticket price in wei
        uint256 totalSupply;     // Total tickets available
        uint256 soldTickets;     // Number of tickets sold
        uint256 royaltyPercent;  // Royalty percentage for resales (in basis points, e.g., 500 = 5%)
        uint256 maxResalePrice;  // Maximum resale price (0 = no limit)
        bool resaleAllowed;      // Whether resale is allowed
        bool active;             // Event is active
        uint256 eventDate;       // Event timestamp
    }

    // Ticket structure
    struct Ticket {
        uint256 tokenId;
        string eventId;
        address originalOwner;
        uint256 purchasePrice;
        bool redeemed;
        uint256 mintedAt;
    }

    // Mappings
    mapping(string => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(string => bool) public eventExists;
    mapping(address => mapping(string => uint256[])) public userEventTickets;

    // Events
    event EventCreated(string indexed eventId, address indexed organizer, uint256 price, uint256 totalSupply);
    event TicketMinted(uint256 indexed tokenId, string indexed eventId, address indexed buyer, uint256 price);
    event TicketRedeemed(uint256 indexed tokenId, string indexed eventId, address indexed owner);
    event TicketResold(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);
    event RoyaltyPaid(string indexed eventId, address indexed organizer, uint256 amount);

    constructor() ERC721("TikitiChain Ticket", "TIKITI") {}

    /**
     * @dev Create a new event
     */
    function createEvent(
        string memory _eventId,
        uint256 _price,
        uint256 _totalSupply,
        uint256 _royaltyPercent,
        uint256 _maxResalePrice,
        bool _resaleAllowed,
        uint256 _eventDate
    ) external {
        require(!eventExists[_eventId], "Event already exists");
        require(_totalSupply > 0, "Total supply must be greater than 0");
        require(_royaltyPercent <= 10000, "Royalty percent cannot exceed 100%");

        events[_eventId] = Event({
            eventId: _eventId,
            organizer: msg.sender,
            price: _price,
            totalSupply: _totalSupply,
            soldTickets: 0,
            royaltyPercent: _royaltyPercent,
            maxResalePrice: _maxResalePrice,
            resaleAllowed: _resaleAllowed,
            active: true,
            eventDate: _eventDate
        });

        eventExists[_eventId] = true;

        emit EventCreated(_eventId, msg.sender, _price, _totalSupply);
    }

    /**
     * @dev Mint a new ticket for an event
     */
    function mintTicket(string memory _eventId, string memory _tokenURI) external payable nonReentrant {
        require(eventExists[_eventId], "Event does not exist");
        Event storage eventData = events[_eventId];
        require(eventData.active, "Event is not active");
        require(eventData.soldTickets < eventData.totalSupply, "All tickets sold");
        require(msg.value >= eventData.price, "Insufficient payment");
        require(block.timestamp < eventData.eventDate, "Event has already occurred");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        tickets[tokenId] = Ticket({
            tokenId: tokenId,
            eventId: _eventId,
            originalOwner: msg.sender,
            purchasePrice: eventData.price,
            redeemed: false,
            mintedAt: block.timestamp
        });

        eventData.soldTickets++;
        userEventTickets[msg.sender][_eventId].push(tokenId);

        // Transfer payment to organizer
        payable(eventData.organizer).transfer(msg.value);

        emit TicketMinted(tokenId, _eventId, msg.sender, eventData.price);
    }

    /**
     * @dev Redeem a ticket (mark as used at event entry)
     */
    function redeemTicket(uint256 _tokenId) external {
        require(_exists(_tokenId), "Ticket does not exist");
        Ticket storage ticket = tickets[_tokenId];
        Event storage eventData = events[ticket.eventId];

        require(ownerOf(_tokenId) == msg.sender || eventData.organizer == msg.sender, "Not authorized");
        require(!ticket.redeemed, "Ticket already redeemed");
        require(block.timestamp >= eventData.eventDate, "Event has not started yet");

        ticket.redeemed = true;

        emit TicketRedeemed(_tokenId, ticket.eventId, ownerOf(_tokenId));
    }

    /**
     * @dev Transfer ticket with resale restrictions and royalty payment
     */
    function transferTicket(uint256 _tokenId, address _to, uint256 _price) external payable nonReentrant {
        require(_exists(_tokenId), "Ticket does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not the ticket owner");
        require(!tickets[_tokenId].redeemed, "Ticket already redeemed");

        Ticket storage ticket = tickets[_tokenId];
        Event storage eventData = events[ticket.eventId];

        require(eventData.resaleAllowed, "Resale not allowed for this event");
        require(block.timestamp < eventData.eventDate, "Event has already occurred");

        if (eventData.maxResalePrice > 0) {
            require(_price <= eventData.maxResalePrice, "Price exceeds maximum resale price");
        }

        require(msg.value >= _price, "Insufficient payment");

        // Calculate and pay royalty to organizer
        uint256 royaltyAmount = (_price * eventData.royaltyPercent) / 10000;
        uint256 sellerAmount = _price - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(eventData.organizer).transfer(royaltyAmount);
            emit RoyaltyPaid(ticket.eventId, eventData.organizer, royaltyAmount);
        }

        payable(msg.sender).transfer(sellerAmount);

        // Transfer the NFT
        _transfer(msg.sender, _to, _tokenId);

        // Update user event tickets
        userEventTickets[_to][ticket.eventId].push(_tokenId);

        emit TicketResold(_tokenId, msg.sender, _to, _price);
    }

    /**
     * @dev Deactivate an event (only organizer)
     */
    function deactivateEvent(string memory _eventId) external {
        require(eventExists[_eventId], "Event does not exist");
        require(events[_eventId].organizer == msg.sender, "Not the event organizer");

        events[_eventId].active = false;
    }

    /**
     * @dev Get event details
     */
    function getEvent(string memory _eventId) external view returns (Event memory) {
        require(eventExists[_eventId], "Event does not exist");
        return events[_eventId];
    }

    /**
     * @dev Get ticket details
     */
    function getTicket(uint256 _tokenId) external view returns (Ticket memory) {
        require(_exists(_tokenId), "Ticket does not exist");
        return tickets[_tokenId];
    }

    /**
     * @dev Get all ticket IDs owned by a user for a specific event
     */
    function getUserEventTickets(address _user, string memory _eventId) external view returns (uint256[] memory) {
        return userEventTickets[_user][_eventId];
    }

    /**
     * @dev Check if a token exists
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
