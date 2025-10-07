import { Location } from "./location";

export type User = {
  id: string;
  email: string;
  username: string;
  activities?: string[];
  interests?: string[];
  firstname?: string;
  lastname?: string;
  location?: Location;
};
