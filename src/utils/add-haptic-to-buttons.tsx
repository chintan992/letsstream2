import React from "react";
import { triggerHapticFeedback } from "./haptic-feedback";

/**
 * Adds haptic feedback to all button elements in a React component tree.
 * This function works by recursively traversing the React element tree and
 * enhancing all button elements with haptic feedback.
 *
 * @param element The React element to process
 * @returns A new React element with haptic feedback added to all buttons
 */
function addHapticToButtons(element: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(element)) {
    return element;
  }

  // Process children recursively
  const children = React.Children.map(
    element.props.children,
    addHapticToButtons
  );

  // Check if this is a button or Button component
  const isButtonType =
    element.type === "button" ||
    (typeof element.type === "function" &&
      (("displayName" in element.type &&
        (element.type as { displayName?: string }).displayName === "Button") ||
        ("name" in element.type &&
          (element.type as { name?: string }).name === "Button")));

  // For button elements, add haptic feedback to onClick handler
  if (isButtonType) {
    const originalOnClick = element.props.onClick;

    const enhancedOnClick = (e: React.MouseEvent) => {
      // Trigger haptic feedback
      triggerHapticFeedback(15);

      // Call the original onClick handler if it exists
      if (originalOnClick) {
        originalOnClick(e);
      }
    };

    // Create a new element with the enhanced onClick handler
    return React.cloneElement(element, {
      ...element.props,
      onClick: enhancedOnClick,
      children,
    });
  }

  // For non-button elements, just update children
  if (children === element.props.children) {
    return element;
  }

  return React.cloneElement(element, { ...element.props, children });
}

/**
 * Higher-order component that adds haptic feedback to all buttons in a component.
 *
 * Usage:
 * ```
 * const EnhancedComponent = withHapticFeedback(MyComponent);
 * ```
 *
 * @param Component The component to enhance
 * @returns A new component with haptic feedback added to all buttons
 */
function withHapticFeedback<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const WithHapticFeedback: React.FC<P> = props => {
    const element = <Component {...props} />;
    return addHapticToButtons(element) as React.ReactElement;
  };

  let componentName = "Component";
  if (typeof Component === "function") {
    // Check if displayName exists on the function
    componentName =
      (Object.prototype.hasOwnProperty.call(Component, "displayName")
        ? (Component as { displayName?: string }).displayName
        : undefined) ||
      Component.name ||
      "Component";
  }
  WithHapticFeedback.displayName = `WithHapticFeedback(${componentName})`;
  return WithHapticFeedback;
}

/**
 * Automatically enhance an entire application with haptic feedback.
 * This function should be applied to the root component of your application.
 *
 * Usage:
 * ```
 * const App = () => (
 *   <div>
 *     <button onClick={() => console.log('clicked')}>Click me</button>
 *   </div>
 * );
 *
 * export default enhanceAppWithHaptics(App);
 * ```
 */
export function enhanceAppWithHaptics<P extends object>(
  App: React.ComponentType<P>
): React.FC<P> {
  return withHapticFeedback(App);
}
