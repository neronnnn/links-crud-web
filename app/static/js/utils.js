export function adjustWidth(input) {
    const tempSpan = input.previousElementSibling;
    
    tempSpan.textContent = input.value || '';
    
    // Ajustar ancho del input + 2px para bordes/padding
    input.style.width = `${tempSpan.offsetWidth + 2}px`;
}

export function isValidUrl(url, defaultProtocol = 'http://') {
    try {
      // Si no tiene protocolo, añadir el protocolo por defecto
      if (!url.includes('://')) {
        url = defaultProtocol + url;
      }
  
      // Intenta crear un objeto URL
      const urlObject = new URL(url);
      
      // Verifica que tenga hostname (dominio)
      if (!urlObject.hostname) {
        return {
          isValid: false,
          error: 'URL debe incluir un nombre de dominio'
        };
      }
      
      // Verifica que el hostname tenga al menos un punto (para el TLD)
      if (!urlObject.hostname.includes('.')) {
        return {
          isValid: false,
          error: 'URL debe incluir un TLD (.com, .org, etc.)'
        };
      }
      
      // Verifica que haya algo antes del TLD
      const [domainName] = urlObject.hostname.split('.');
      if (!domainName) {
        return {
          isValid: false,
          error: 'URL debe incluir un nombre antes del TLD'
        };
      }
  
      // Si pasa todas las validaciones
      return {
        isValid: true,
        url: urlObject.href,
        wasProtocolAdded: !url.includes('://')
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'URL inválida: ' + error.message
      };
    }
  }

export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}