export interface Country {
  code: string;
  name: string;
  locale: string;
  language: string;
  currency: string;
  phoneCode: string;
  timezones: Array<{
    name: string;
  }>;
}

declare const countries: Country[];
export default countries;
