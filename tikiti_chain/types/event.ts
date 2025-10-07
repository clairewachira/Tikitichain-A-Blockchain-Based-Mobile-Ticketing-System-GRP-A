import { Location } from "./location";

export type Event = {
  id: string;
  title: string;
  description: string;
  location: Location;
  gallery: string[];
  price: number;
  tags: string[];
  category: string;
};
