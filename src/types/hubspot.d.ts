interface HubSpotFormsCreateOptions {
  portalId: string;
  formId: string;
  region?: string;
  target?: string;
  onFormSubmitted?: () => void;
}

interface HubSpotForms {
  create: (options: HubSpotFormsCreateOptions) => void;
}

interface HubSpot {
  forms: HubSpotForms;
}

interface Window {
  hbspt: HubSpot;
}
