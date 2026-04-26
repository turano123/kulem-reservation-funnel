export type SearchMode = "exact" | "flexible";

export type ISODateString = string;

export type Amenity = string;

export type BookingRange = {
  start: ISODateString;
  end: ISODateString;
  type?: "blocked" | "pending";
};

export type BreakfastPricing = {
  adultPerNight: number;
  childPerNight: number;
};

export type PropertyRates = {
  weekday: number;
  weekend: number;
};

export type Property = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  locationLabel: string;
  layout: string;
  maxGuests: number;
  amenities: Amenity[];
  breakfastMode: "dahil" | "opsiyonel" | "hariç";
  heroImage: string;
  gallery: string[];
  reviewScore: number;
  reviewCount: number;
  idealFor: string[];
  rules: string[];
  story: string;
  sortOrder: number;
  rates: PropertyRates;
  breakfastPricing?: BreakfastPricing;
  bookedRanges: BookingRange[];
};

export type ExactSearchInput = {
  mode: "exact";
  checkin: ISODateString;
  checkout: ISODateString;
  adults: number;
  children: number;
  childAges: number[];
  breakfast: boolean;
};

export type FlexibleSearchInput = {
  mode: "flexible";
  durationLabel: string;
  monthLabel: string;
  adults: number;
  children: number;
  childAges: number[];
};

export type SearchInput = ExactSearchInput | FlexibleSearchInput;

export type NightlyBreakdownItem = {
  date: ISODateString;
  price: number;
  type: "weekday" | "weekend";
};

export type SearchSuggestion = {
  checkin: ISODateString;
  checkout: ISODateString;
};

export type PropertyLiveCardMeta = {
  propertySlug: string;
  propertyName: string;
  source: "google-sheet";
  firstAvailableDate: ISODateString | null;
  firstAvailablePrice: number | null;
  currentYearBestPrice: number | null;
  currentYearBestPriceDate: ISODateString | null;
  availableFutureDates: number;
};

export type SearchResultStatus = "available" | "unavailable";

export type SearchResult = {
  property: Property;
  status: SearchResultStatus;
  label: string;

  totalPrice?: number;
  startingPrice?: number;

  nightlyBreakdown?: NightlyBreakdownItem[];
  suggestion?: SearchSuggestion;
  reason?: string;

  liveCardMeta?: PropertyLiveCardMeta;
};

export type Review = {
  author: string;
  rating: number;
  dateLabel: string;
  text: string;
  highlight?: string;
};

export type QuotePayload = {
  propertySlug: string;
  propertyName: string;
  mode: SearchMode;
  checkin?: ISODateString;
  checkout?: ISODateString;
  adults: number;
  children: number;
  childAges: number[];
  shownPrice?: number;
};

export type PropertyCardQueryContext = {
  shownPrice?: number;
  checkin?: ISODateString;
  checkout?: ISODateString;
  adults: number;
  children: number;
  childAges: number[];
};