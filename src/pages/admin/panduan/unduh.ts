import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/session';
import { guideGroups, guideRoutes, guideSections, guideUpdated } from '../../../data/admin-guide';

export const prerender = false;
export const GET: APIRoute = ({ cookies, redirect, url }) => {
  if (!getSession(cookies)) return redirect('/admin/login');
  const lines = [
    '# Panduan Admin ANIA', '', `SOP admin - ${guideUpdated}`, '',
    'Panduan Produk, Order, dan Pengaturan. Screenshot mengikuti versi lokal; data order pada gambar adalah contoh, bukan order nyata.', '',
    'Gunakan akun dari pengelola. Password tidak dicantumkan. Perubahan lokal tidak mengubah website live. Jangan menjalankan deploy tanpa persetujuan.', '',
    '## Peta Halaman', '',
    ...guideRoutes.map(([name, route, description]) => `- ${name}: \`${route}\` - ${description}`), '',
  ];
  for (const group of guideGroups) {
    lines.push(`## ${group.title}`, '', group.description, '');
    for (const section of guideSections.filter(item => item.group === group.id)) {
      lines.push(`### ${String(guideSections.indexOf(section) + 1).padStart(2, '0')} ${section.title}`, '');
      if (section.route) lines.push(`Halaman: \`${section.route}\``, '');
      lines.push(section.intro, '', 'Langkah kerja', '', ...section.steps.map((step, i) => `${i + 1}. ${step}`), '');
      if (section.fields) for (const field of section.fields) lines.push(`- **${field.name}**: ${field.description} Contoh/catatan: ${field.example}`);
      lines.push('');
      if (section.image) lines.push(`![${section.image.alt}](${url.origin}/assets/admin-guide/${section.image.file})`, '', section.image.caption, '');
      if (section.result) lines.push(`**Tanda berhasil:** ${section.result}`, '');
      if (section.notes) lines.push('Catatan penting', '', ...section.notes.map(note => `- ${note}`), '');
    }
  }
  return new Response(lines.join('\n'), { headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Disposition': 'attachment; filename="SOP-Admin-ANIA.md"',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
};
