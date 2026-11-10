import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {OfferText,plainOfferText} from '../app/components/shida/offer-text';
const render=(value:string)=>renderToStaticMarkup(React.createElement(OfferText,{value}));

it('renders explicit bold, italic, headings and mixed long lists without guessing prose',()=>{
  const html=render('### Gestion\n- **Préparer** les comptes.\n- '+ 'Longue mission. '.repeat(50)+'\n\n1. _Expérience_\n2. Diplôme\n\nPhrase courte\nAutre phrase');
  expect(html).toContain('<h3>Gestion</h3>'); expect(html).toContain('<ul><li><strong>Préparer</strong>');
  expect(html).toContain('<ol start="1"><li><em>Expérience</em>');
  expect(html).toContain('<p>Phrase courte<br/>Autre phrase</p>');
  expect(html.match(/<li>/g)).toHaveLength(4);
  expect(render('**Gras _et italique_**')).toContain('<strong>Gras <em>et italique</em></strong>');
});
it('keeps HTML, links and images inert, and retains malformed markers as text',()=>{
  const html=render('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[ouvrir](javascript:alert(1))\n![image](https://example.com/a.png)\n**incomplet');
  for(const tag of ['<script','<img','<a ','onerror="']) expect(html).not.toContain(tag);
  expect(html).toContain('&lt;script&gt;'); expect(html).toContain('**incomplet');
});
it('uses explicit markers for numbered and pasted bullet lists and preserves blank paragraphs',()=>{
  expect(render('• Première\n• Deuxième')).toContain('<ul><li>Première</li><li>Deuxième</li></ul>');
  expect(render('3. Trois\n4. Quatre')).toContain('<ol start="3">');
  expect(render('Une\n\nDeux')).toContain('<p>Une</p><p>Deux</p>');
  expect(plainOfferText('### Titre\n- **Gestion** _quotidienne_')).toBe('Titre\nGestion quotidienne');
});
