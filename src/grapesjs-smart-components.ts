export default function addSmartComponents(editor: any) {
  const domc = editor.DomComponents;
  const bm = editor.BlockManager;

  // 1. Smart Pricing Table
  domc.addType('smart-pricing-table', {
    isComponent: (el: any) => el.tagName === 'SECTION' && el.classList.contains('smart-pricing-table'),
    model: {
      defaults: {
        tagName: 'section',
        classes: ['smart-pricing-table'],
        attributes: { style: 'padding: 80px 20px; background-color: #f9fafb; font-family: sans-serif;' },
        traits: [
          {
            type: 'number',
            name: 'columns',
            label: 'Number of Plans',
            min: 1,
            max: 5,
            changeProp: 1,
          }
        ],
        columns: 3,
        components: `
          <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 2.5rem; margin-bottom: 10px; color: #111827;">Simple, transparent pricing</h2>
            <p style="color: #6b7280; margin-bottom: 50px; font-size: 1.1rem;">No hidden fees. No surprise charges.</p>
            <div class="pricing-cards-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
              <div style="flex: 1; min-width: 250px; max-width: 350px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: left;">
                <h3 style="font-size: 1.5rem; color: #111827; margin-bottom: 15px;">Basic</h3>
                <div style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 20px;">$9<span style="font-size: 1rem; color: #6b7280; font-weight: normal;">/mo</span></div>
                <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #4b5563; line-height: 2;">
                  <li>✓ 1 Project</li>
                  <li>✓ Basic Analytics</li>
                </ul>
                <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: bold;">Choose Basic</a>
              </div>
              <div style="flex: 1; min-width: 250px; max-width: 350px; background: #111827; border-radius: 16px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: left; position: relative; transform: scale(1.05);">
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Most Popular</div>
                <h3 style="font-size: 1.5rem; color: white; margin-bottom: 15px;">Pro</h3>
                <div style="font-size: 3rem; font-weight: bold; color: white; margin-bottom: 20px;">$29<span style="font-size: 1rem; color: #9ca3af; font-weight: normal;">/mo</span></div>
                <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #d1d5db; line-height: 2;">
                  <li>✓ Unlimited Projects</li>
                  <li>✓ Advanced Analytics</li>
                </ul>
                <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Choose Pro</a>
              </div>
              <div style="flex: 1; min-width: 250px; max-width: 350px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: left;">
                <h3 style="font-size: 1.5rem; color: #111827; margin-bottom: 15px;">Enterprise</h3>
                <div style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 20px;">$99<span style="font-size: 1rem; color: #6b7280; font-weight: normal;">/mo</span></div>
                <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #4b5563; line-height: 2;">
                  <li>✓ Custom Solutions</li>
                  <li>✓ 24/7 Support</li>
                </ul>
                <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: bold;">Contact Us</a>
              </div>
            </div>
          </div>
        `
      },
      init() {
        this.on('change:columns', this.updateColumns);
      },
      updateColumns() {
        const cols = this.get('columns');
        const container = this.find('.pricing-cards-container')[0];
        if (!container) return;
        
        const currentCards = container.components().length;
        if (cols > currentCards) {
          for (let i = currentCards; i < cols; i++) {
            container.append(`
              <div style="flex: 1; min-width: 250px; max-width: 350px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: left;">
                <h3 style="font-size: 1.5rem; color: #111827; margin-bottom: 15px;">Plan ${i+1}</h3>
                <div style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 20px;">$${(i+1)*10}<span style="font-size: 1rem; color: #6b7280; font-weight: normal;">/mo</span></div>
                <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #4b5563; line-height: 2;">
                  <li>✓ Feature 1</li>
                  <li>✓ Feature 2</li>
                </ul>
                <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: bold;">Choose Plan</a>
              </div>
            `);
          }
        } else if (cols < currentCards) {
          for (let i = currentCards - 1; i >= cols; i--) {
            container.components().at(i).remove();
          }
        }
      }
    }
  });

  bm.add('smart-pricing-table', {
    label: 'Smart Pricing Table',
    category: 'Smart Components',
    attributes: { class: 'fa fa-money' },
    content: { type: 'smart-pricing-table' }
  });

  // 2. Smart Feature Grid
  domc.addType('smart-feature-grid', {
    isComponent: (el: any) => el.tagName === 'SECTION' && el.classList.contains('smart-feature-grid'),
    model: {
      defaults: {
        tagName: 'section',
        classes: ['smart-feature-grid'],
        attributes: { style: 'padding: 80px 20px; background-color: white; font-family: sans-serif;' },
        traits: [
          {
            type: 'number',
            name: 'columns',
            label: 'Columns',
            min: 1,
            max: 6,
            changeProp: 1,
          },
          {
            type: 'number',
            name: 'rows',
            label: 'Rows',
            min: 1,
            max: 20,
            changeProp: 1,
          }
        ],
        columns: 3,
        rows: 2,
        components: `
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 60px;">
              <h2 style="font-size: 2.5rem; color: #111827; margin-bottom: 15px;">Everything you need</h2>
              <p style="color: #6b7280; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">A complete toolkit for building modern applications.</p>
            </div>
            <div class="feature-grid-container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;">
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #3b82f6;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 1</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #f0fdf4; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #22c55e;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 2</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #ef4444;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 3</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #ef4444;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 4</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #ef4444;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 5</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #ef4444;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Feature 6</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the feature goes here.</p>
              </div>
            </div>
          </div>
        `
      },
      init() {
        this.on('change:columns', this.updateGrid);
        this.on('change:rows', this.updateGrid);
      },
      updateGrid() {
        const cols = this.get('columns');
        const rows = this.get('rows');
        const total = cols * rows;
        const container = this.find('.feature-grid-container')[0];
        if (!container) return;
        
        container.addStyle({ 'grid-template-columns': `repeat(${cols}, 1fr)` });
        
        const currentCards = container.components().length;
        if (total > currentCards) {
          for (let i = currentCards; i < total; i++) {
            container.append(`
              <div style="padding: 20px;">
                <div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #4b5563;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">New Feature</h3>
                <p style="color: #6b7280; line-height: 1.6;">Description of the new feature.</p>
              </div>
            `);
          }
        } else if (total < currentCards) {
          for (let i = currentCards - 1; i >= total; i--) {
            container.components().at(i).remove();
          }
        }
      }
    }
  });

  bm.add('smart-feature-grid', {
    label: 'Smart Feature Grid',
    category: 'Smart Components',
    attributes: { class: 'fa fa-th' },
    content: { type: 'smart-feature-grid' }
  });

  // 3. Smart Footer
  domc.addType('smart-footer', {
    isComponent: (el: any) => el.tagName === 'FOOTER' && el.classList.contains('smart-footer'),
    model: {
      defaults: {
        tagName: 'footer',
        classes: ['smart-footer'],
        attributes: { style: 'background-color: #111827; color: #9ca3af; padding: 80px 20px 40px; font-family: sans-serif;' },
        traits: [
          {
            type: 'number',
            name: 'columns',
            label: 'Footer Columns',
            min: 1,
            max: 6,
            changeProp: 1,
          }
        ],
        columns: 4,
        components: `
          <div class="footer-grid-container" style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; border-bottom: 1px solid #374151; padding-bottom: 40px; margin-bottom: 40px;">
            <div>
              <h3 style="color: white; font-size: 1.5rem; font-weight: bold; margin-bottom: 20px;">Brand</h3>
              <p style="line-height: 1.6; margin-bottom: 20px;">Making web development accessible to everyone, everywhere.</p>
            </div>
            <div>
              <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Solutions</h4>
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">Marketing</a></li>
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Support</h4>
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">Pricing</a></li>
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Company</h4>
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">About</a></li>
                <li><a href="#" style="color: #9ca3af; text-decoration: none;">Blog</a></li>
              </ul>
            </div>
          </div>
          <div style="max-width: 1200px; margin: 0 auto; text-align: center; font-size: 0.9rem;">
            &copy; 2026 Your Company, Inc. All rights reserved.
          </div>
        `
      },
      init() {
        this.on('change:columns', this.updateColumns);
      },
      updateColumns() {
        const cols = this.get('columns');
        const container = this.find('.footer-grid-container')[0];
        if (!container) return;
        
        container.addStyle({ 'grid-template-columns': `repeat(${cols}, 1fr)` });
        
        const currentCards = container.components().length;
        if (cols > currentCards) {
          for (let i = currentCards; i < cols; i++) {
            container.append(`
              <div>
                <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Column ${i+1}</h4>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                  <li><a href="#" style="color: #9ca3af; text-decoration: none;">Link 1</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none;">Link 2</a></li>
                </ul>
              </div>
            `);
          }
        } else if (cols < currentCards) {
          for (let i = currentCards - 1; i >= cols; i--) {
            container.components().at(i).remove();
          }
        }
      }
    }
  });

  bm.add('smart-footer', {
    label: 'Smart Footer',
    category: 'Smart Components',
    attributes: { class: 'fa fa-sitemap' },
    content: { type: 'smart-footer' }
  });
}
