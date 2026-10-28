import { BrowserMockup, BrowserMockupProps } from "./BrowserMockup";

/**
 * BrowserFrame wrapper maintaining backward compatibility while offering
 * all BrowserMockup capabilities.
 */
export function BrowserFrame(props: BrowserMockupProps) {
  return <BrowserMockup {...props} />;
}
