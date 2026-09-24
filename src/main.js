import '../styles.css';
import './theme.css';
import './lkpd.css';
import './intro.css';
import './diagnostik.css';
import './post-test.css';
import '../app.js';
import '../js/tools.js';
import '../js/pencils.js';
import '../js/etiket.js';
import '../js/lines.js';
import '../js/projection.js';
import '../js/book-reader.js';
import '../js/model-3d.js';
import '../js/intro.js';
import { initLkpd } from '../js/lkpd.js';
import { initAuth } from '../js/auth.js';
import { initDiagnostik } from '../js/diagnostik.js';
import { initPostTest } from '../js/post-test.js';
import { publicAssetUrl } from './asset-url.js';

document.addEventListener('DOMContentLoaded', () => {
  initLkpd();
  initAuth();
  initDiagnostik();
  initPostTest();
  const pageTitle = document.getElementById('current-page-title');
  const navigationItems = document.querySelectorAll('.nav-item');
  const absoluteSocialImage = new URL(publicAssetUrl('og.png'), window.location.origin).href;

  document.getElementById('og-image')?.setAttribute('content', absoluteSocialImage);
  document.getElementById('twitter-image')?.setAttribute('content', absoluteSocialImage);

  pageTitle?.setAttribute('aria-live', 'polite');

  navigationItems.forEach((item) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        item.click();
      }
    });
  });
});
