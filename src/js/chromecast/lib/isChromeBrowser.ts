export function isChromeBrowser(): boolean {
   const userAgent = navigator.userAgent.toLowerCase();

   return userAgent.includes('chrome') && !userAgent.includes('edg'); // Chrome but not Edge
}
