"use client";

import { useEffect } from "react";

export function CustomElementGuard() {
  useEffect(() => {
    // Prevent duplicate custom element registration errors
    // This is typically caused by browser extensions or third-party scripts
    if (typeof window !== "undefined" && window.customElements) {
      const originalDefine = window.customElements.define.bind(window.customElements);
      
      window.customElements.define = function(name: string, constructor: any, options?: ElementDefinitionOptions) {
        try {
          // Check if element is already defined
          if (!window.customElements.get(name)) {
            originalDefine(name, constructor, options);
          } else {
            console.info(`Custom element '${name}' already defined, skipping re-registration`);
          }
        } catch (error) {
          // Silently handle duplicate registration errors
          if (error instanceof DOMException && error.name === 'NotSupportedError') {
            console.info(`Prevented duplicate registration of custom element '${name}'`);
          } else {
            console.error(`Error registering custom element '${name}':`, error);
          }
        }
      };
    }
  }, []);

  return null;
}