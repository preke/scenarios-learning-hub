// Keep the workbench icon set inline so the courses also work from local files.
(() => {
  const paths = {
    "route": '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 6h7.5a3 3 0 0 1 0 6h-5a3 3 0 0 0 0 6H17"/>',
    "book": '<path d="M3 5c3.8-1.7 6.3-1.2 9 1 2.7-2.2 5.2-2.7 9-1v14c-3.8-1.7-6.3-1.2-9 1-2.7-2.2-5.2-2.7-9-1zM12 6v14"/>',
    "bars": '<path d="M4 20v-4h3v4zM10.5 20v-9h3v9zM17 20V5h3v15z"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.4 2.2"/>',
    "chevron": '<path d="m9 6 6 6-6 6"/>',
    "down": '<path d="m6 9 6 6 6-6"/>',
    "arrow": '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    "back": '<path d="M20 12H5m6 6-6-6 6-6"/>',
    "cube": '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10m-4.5-17.5 9 5"/>',
    "layers": '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    "activity": '<path d="M2 12h4l3-8 5 16 3-8h5"/>',
    "rotate3d": '<path d="M4 7c4-4 12-4 16 1m-4 0 4 .4.3-4M20 17c-4 4-12 4-16-1m4 0-4-.4-.4 4"/><circle cx="12" cy="12" r="2.5"/>',
    "minus": '<path d="M5 12h14"/>',
    "plus": '<path d="M5 12h14M12 5v14"/>',
    "reset": '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    "expand": '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
    "collapse": '<path d="M3 9h6V3m12 6h-6V3M9 21v-6H3m12 6v-6h6"/>',
    "solar": '<path d="m5 4 16 2-3 12-16-2 3-12zM10 5 7 16m9-10-3 11M4 10l15.5 2M10 17v3m-4 1h8"/>',
    "camera": '<rect x="2.8" y="6" width="18.4" height="14" rx="2.5"/><circle cx="12" cy="13" r="3.5"/><path d="m7 6 1.5-3h7L17 6"/>',
    "adcs": '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
    "computer": '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx=".5"/><path d="M8 2v3m4-3v3m4-3v3M8 19v3m4-3v3m4-3v3M2 8h3m-3 4h3m-3 4h3m14-8h3m-3 4h3m-3 4h3"/>',
    "power": '<rect x="2.5" y="6" width="16.5" height="12" rx="2"/><path d="M19 10h2.5v4H19M12 8.5l-4 4h5l-3 3.2"/>',
    "radio": '<circle cx="12" cy="9" r="1.5"/><path d="m8 21 4-10 4 10m-6.5-4h5M7.5 5a6 6 0 0 0 0 8m9-8a6 6 0 0 1 0 8M5 2a10 10 0 0 0 0 14M19 2a10 10 0 0 1 0 14"/>',
    "spark": '<path d="m12 3 2.1 6.2L20 12l-5.9 2.8L12 21l-2.1-6.2L4 12l5.9-2.8zM20 2v4m-2-2h4"/>',
    "compass": '<circle cx="12" cy="12" r="9"/><path d="m16.5 7.5-3.2 5.8-5.8 3.2 3.2-5.8z"/>',
    "nodes": '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 7v4M5 16v-5h14v5"/>',
    "orbit": '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-35 12 12)"/>',
    "close": '<path d="m6 6 12 12M18 6 6 18"/>',
    "bolt": '<path d="m13 2-9 12h7l-1 8 10-13h-8z"/>',
    "external": '<path d="M14 3h7v7m0-7L11 13M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>',
    "check": '<path d="m4 12 5 5L20 6"/>',
    "file": '<path d="M5 3h9l5 5v13H5zM14 3v6h5M9 13h6m-6 4h5"/>',
    "scope": '<path d="m3 9 12-5 2 5-12 5zM15 4l3-1.3 2.4 5.8-3.4 1.3M6 14l1 2.5 3-1.2-1-2.5M11 13l2 3m-1-2-5 7m5-7 5 7"/>',
    "mount": '<path d="M5 5v6a7 7 0 0 0 14 0V5M12 18v3m-5 0h10"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>',
    "aperture": '<circle cx="12" cy="12" r="9"/><path d="m12 3 5 8m3 6-10 1m-6-4 5-8m0 0 6-.5m2 5-3 6m-4 1-3-5"/>',
    "resistor": '<path d="M2 12h4l2-5 3 10 3-10 3 10 2-5h3"/>',
  };
  const ns = 'http://www.w3.org/2000/svg';
  const sprite = document.createElementNS(ns, 'svg');
  sprite.setAttribute('class','defs');
  sprite.setAttribute('aria-hidden','true');
  sprite.innerHTML = '<defs>' + Object.entries(paths).map(([id,shape]) =>
    '<symbol id="ic-' + id + '" viewBox="0 0 24 24">' + shape + '</symbol>').join('') + '</defs>';
  document.body.prepend(sprite);
  window.fillWorkbenchIcons = (root = document) => {
    root.querySelectorAll('i[data-icon]:empty').forEach(icon => {
      const name = icon.dataset.icon;
      if (!Object.hasOwn(paths, name)) return;
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg focusable="false"><use href="#ic-' + name + '"></use></svg>';
    });
  };
  window.fillWorkbenchIcons();
})();
