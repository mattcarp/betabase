(function() {
  if (typeof window !== 'undefined' && window.customElements) {
    const originalDefine = window.customElements.define;
    window.customElements.define = function(name, constructor, options) {
      if (window.customElements.get(name)) {
        console.info(`Custom element '${name}' already defined, skipping re-registration`);
        return;
      }
      try {
        originalDefine.call(window.customElements, name, constructor, options);
      } catch (e) {
        if (e.name === 'NotSupportedError' || e.message.includes('already been defined')) {
          console.info(`Prevented duplicate registration of custom element '${name}'`);
        } else {
          throw e;
        }
      }
    };
  }
})();
