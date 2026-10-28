import { PhoneMockup, PhoneMockupProps } from "./PhoneMockup";

/**
 * PhoneFrame wrapper maintaining backward compatibility while offering
 * all PhoneMockup video integration & double-bezel capabilities.
 */
export function PhoneFrame(props: PhoneMockupProps) {
  return <PhoneMockup {...props} />;
}
