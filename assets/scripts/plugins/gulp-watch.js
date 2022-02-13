// Inject the browser-sync-client script for gulp watch
if (window.location.hostname === 'venafi-microsite.test') {
  document.write("<script async src='http://venafi-microsite.test:3000/browser-sync/browser-sync-client.js?v=2.18.8'><\/script>");
}
