import App from "./App";
import { enhanceAppWithHaptics } from "./utils/add-haptic-to-buttons.tsx";

// Export the enhanced app for Fast Refresh compatibility
const HapticApp = enhanceAppWithHaptics(App);
export default HapticApp;
