import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that detects if the background behind a fixed/absolute element is dark or light.
 * Uses `elementsFromPoint` to find elements behind the ref, then:
 *   - For <img>: draws to an offscreen canvas and samples pixel brightness
 *   - For elements with background-color: parses the color
 *   - For elements with background-image (gradients): assumes dark
 *
 * Returns `true` when the background is dark (navbar should use white text).
 */
const useBackgroundBrightness = (elementRef) => {
    const [isOverDark, setIsOverDark] = useState(false);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const lastResultRef = useRef(false);

    // Perceived brightness (0-255): higher = lighter
    const perceivedBrightness = useCallback((r, g, b) => {
        return (r * 299 + g * 587 + b * 114) / 1000;
    }, []);

    // Parse "rgb(r,g,b)" or "rgba(r,g,b,a)" → [r,g,b,a?]
    const parseRGBA = useCallback((str) => {
        if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)') return null;
        const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/);
        if (!m) return null;
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        if (a < 0.1) return null;           // nearly transparent → skip
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), a];
    }, []);

    // Sample pixel brightness from an <img> at a given viewport coordinate
    const sampleImage = useCallback((img, viewportX, viewportY) => {
        try {
            if (!img.complete || !img.naturalWidth) return null;

            if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const rect = img.getBoundingClientRect();
            const scaleX = img.naturalWidth / rect.width;
            const scaleY = img.naturalHeight / rect.height;

            // Handle object-fit: cover — the image is cropped to fill the element
            const style = getComputedStyle(img);
            let px, py;
            if (style.objectFit === 'cover') {
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const elAspect = rect.width / rect.height;
                let drawW, drawH, offsetX, offsetY;
                if (imgAspect > elAspect) {
                    drawH = rect.height;
                    drawW = drawH * imgAspect;
                    offsetX = (drawW - rect.width) / 2;
                    offsetY = 0;
                } else {
                    drawW = rect.width;
                    drawH = drawW / imgAspect;
                    offsetX = 0;
                    offsetY = (drawH - rect.height) / 2;
                }
                px = Math.round(((viewportX - rect.left) + offsetX) * (img.naturalWidth / drawW));
                py = Math.round(((viewportY - rect.top) + offsetY) * (img.naturalHeight / drawH));
            } else {
                px = Math.round((viewportX - rect.left) * scaleX);
                py = Math.round((viewportY - rect.top) * scaleY);
            }

            if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return null;
            const d = ctx.getImageData(px, py, 1, 1).data;
            return perceivedBrightness(d[0], d[1], d[2]);
        } catch {
            // CORS error — fall back to "dark" for images (hero images are typically dark)
            return 60;
        }
    }, [perceivedBrightness]);

    // Main check: sample multiple points across the navbar width
    const check = useCallback(() => {
        const el = elementRef.current;
        if (!el) return;

        const navRect = el.getBoundingClientRect();
        const midY = navRect.top + navRect.height / 2;

        // 5 horizontal sample points spread across the navbar
        const xs = [0.15, 0.3, 0.5, 0.7, 0.85].map(
            (pct) => navRect.left + navRect.width * pct
        );

        let brightnessSum = 0;
        let count = 0;

        for (const x of xs) {
            // Get all elements stacked at this point, top-to-bottom
            const stack = document.elementsFromPoint(x, midY);
            // Skip the navbar itself and its children
            const behind = stack.filter((e) => !el.contains(e));

            for (const node of behind) {
                // 1️⃣ <img> tag — sample actual pixels
                if (node.tagName === 'IMG') {
                    const b = sampleImage(node, x, midY);
                    if (b !== null) {
                        brightnessSum += b;
                        count++;
                        break;
                    }
                }

                // 2️⃣ Element with a background-image (CSS gradient / url)
                const cs = getComputedStyle(node);
                if (cs.backgroundImage && cs.backgroundImage !== 'none') {
                    // If it contains a url(...) it's likely a hero image → assume dark
                    if (cs.backgroundImage.includes('url(')) {
                        brightnessSum += 60;
                        count++;
                        break;
                    }
                    // For gradients, try to extract the first color
                    const colorMatch = cs.backgroundImage.match(/rgba?\([^)]+\)/);
                    if (colorMatch) {
                        const rgba = parseRGBA(colorMatch[0]);
                        if (rgba) {
                            brightnessSum += perceivedBrightness(rgba[0], rgba[1], rgba[2]);
                            count++;
                            break;
                        }
                    }
                }

                // 3️⃣ Solid background-color
                const rgba = parseRGBA(cs.backgroundColor);
                if (rgba) {
                    brightnessSum += perceivedBrightness(rgba[0], rgba[1], rgba[2]);
                    count++;
                    break;
                }
            }
        }

        if (count > 0) {
            const avg = brightnessSum / count;
            const dark = avg < 140;              // threshold: anything below ~55% brightness
            if (dark !== lastResultRef.current) {
                lastResultRef.current = dark;
                setIsOverDark(dark);
            }
        }
    }, [elementRef, sampleImage, parseRGBA, perceivedBrightness]);

    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(check);
        };

        // Initial check — wait for images/layout
        const t1 = setTimeout(check, 300);
        const t2 = setTimeout(check, 1000);   // re-check after lazy images load

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', check, { passive: true });

        // Also re-check on route change (React updates DOM, then we check)
        const observer = new MutationObserver(() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(check);
        });
        observer.observe(document.querySelector('main') || document.body, {
            childList: true,
            subtree: true,
            attributes: false,
        });

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', check);
            observer.disconnect();
        };
    }, [check]);

    return isOverDark;
};

export default useBackgroundBrightness;
