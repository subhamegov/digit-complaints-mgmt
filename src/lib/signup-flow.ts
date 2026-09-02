export const SIGNUP_INITIATION_KEY = "digit.prototype.signup.initiation";

export interface SignupInitiationState {
  email: string;
  firstName: string;
  lastName: string;
  organisationName: string;
  organisationCode: string;
  baseCountry: string;
  languages: string[];
  timezone: string;
  financialYearStart: string;
  orgSlug: string;
  approvalFlow: boolean;
}
