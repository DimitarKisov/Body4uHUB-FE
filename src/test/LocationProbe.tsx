// Shows the current URL, so tests can assert where a screen navigated to.
import { useLocation } from "react-router-dom";

export function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}
