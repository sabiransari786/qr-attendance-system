import { useEffect, useRef } from 'react';
import { Rive, useRive, Layout, Fit, Alignment } from 'rive-react';

/**
 * Custom hook for Rive animation control
 * Interactive animations with state management
 */
export const useRiveAnimation = (src, options = {}) => {
  const containerRef = useRef(null);

  const {
    stateMachines = undefined,
    layout = new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    }),
    onStateChange = null,
    onLoad = null,
    ...restOptions
  } = options;

  const { rive, RiveComponent } = useRive({
    src: src,
    stateMachines: stateMachines,
    layout: layout,
    onStateChange: onStateChange,
    onLoad: onLoad,
    ...restOptions
  });

  return {
    containerRef,
    RiveComponent,
    rive,
    isLoaded: !!rive
  };
};

/**
 * Trigger state change in Rive animation
 * Perfect for button clicks and interactions
 */
export const useRiveInput = (rive, stateMachineName) => {
  const triggerInput = (inputName, value) => {
    if (!rive) return;

    const inputs = rive.stateMachineInputs(stateMachineName);
    const input = inputs?.find(i => i.name === inputName);

    if (input) {
      if (typeof value === 'boolean') {
        input.value = value;
      } else if (typeof value === 'number') {
        input.value = value;
      }
    }
  };

  return { triggerInput };
};

/**
 * Manage multiple Rive state machines
 * Orchestrate complex interactions
 */
export const useRiveStateMachine = (rive, stateMachineName) => {
  const getInputs = () => {
    if (!rive) return [];
    return rive.stateMachineInputs(stateMachineName) || [];
  };

  const setInputValue = (inputName, value) => {
    const inputs = getInputs();
    const input = inputs.find(i => i.name === inputName);
    if (input) {
      input.value = value;
    }
  };

  const fireEvent = (inputName) => {
    setInputValue(inputName, true);
    setTimeout(() => setInputValue(inputName, false), 10);
  };

  return {
    getInputs,
    setInputValue,
    fireEvent
  };
};
