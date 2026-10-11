/**
 * Copies text, and says honestly whether it worked.
 *
 * The async clipboard API needs a secure context and can be refused by a
 * permissions policy. When it is unavailable this falls back to the selection
 * based route, and when that fails too it returns false, so the button can say
 * so instead of claiming a copy that did not happen.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection route.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
