import { Routes } from '@angular/router';

const suffix = ' | Houston Electron Microscopy';

export const routes: Routes = [
  { path: 'admin', title: 'Administration' + suffix, loadComponent: () => import('./pages/admin/admin').then(m => m.AdminPage) },
  { path: 'shop', redirectTo: 'services', pathMatch: 'full' },
  { path: 'portal', title: 'Client Portal' + suffix, loadComponent: () => import('./pages/portal/portal').then(m => m.PortalPage) },
  {
    path: '',
    title: 'Houston Electron Microscopy | SEM/EDS & Micro FT-IR Materials Analysis',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'about',
    title: 'About' + suffix,
    loadComponent: () => import('./pages/about/about').then((m) => m.AboutPage),
  },
  {
    path: 'sem-edx',
    title: 'SEM/EDX Analysis' + suffix,
    loadComponent: () => import('./pages/sem-edx/sem-edx').then((m) => m.SemEdxPage),
  },
  {
    path: 'micro-ftir',
    title: 'Micro FT-IR Analysis' + suffix,
    loadComponent: () => import('./pages/micro-ftir/micro-ftir').then((m) => m.MicroFtirPage),
  },
  {
    path: 'services',
    title: 'Services' + suffix,
    loadComponent: () => import('./pages/services/services').then((m) => m.ServicesPage),
  },
  { path: 'services/:slug/order', title: 'Order laboratory service' + suffix, loadComponent: () => import('./pages/service-order/service-order').then(m => m.ServiceOrderPage) },
  {
    path: 'services/:slug',
    loadComponent: () => import('./pages/service-detail/service-detail').then((m) => m.ServiceDetailPage),
  },
  {
    path: 'sample-submission',
    title: 'How to send samples' + suffix,
    loadComponent: () => import('./pages/sample-submission/sample-submission').then((m) => m.SampleSubmissionPage),
  },
  {
    path: 'galleries',
    title: 'Galleries' + suffix,
    loadComponent: () => import('./pages/galleries/galleries').then((m) => m.GalleriesPage),
  },
  {
    path: 'contact',
    title: 'Contact' + suffix,
    loadComponent: () => import('./pages/contact/contact').then((m) => m.ContactPage),
  },
  {
    path: '**',
    title: 'Page not found' + suffix,
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
