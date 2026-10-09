import React, { 
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  forwardRef,
  useImperativeHandle 
} from 'react';
import { communityAPI, marketplaceAPI, messagingAPI, notificationsAPI, projectsAPI } from './api/endpoints';
import homepageHeroImage from './assets/homepage-community-hero.png';
const LearningHub = lazy(() => import('./pages/LearningHub.jsx'));
const OfficeHoursEvents = lazy(() => import('./pages/OfficeHoursEvents.jsx'));
const MessagingPage = lazy(() => import('./pages/MessagingPage.jsx'));
const DueDiligenceVault = lazy(() => import('./pages/DueDiligencePage.jsx'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings.jsx'));
const PublicProfilePage = lazy(() => import('./components/ProfileSettings.jsx').then((module) => ({ default: module.PublicProfilePage })));
import { 
  Eye,
  EyeOff,
  Camera,
  Mail,
  X,
  LogOut,
  Menu
} from 'lucide-react';

/* ============================================================
   Stylesheet — plain CSS (not Tailwind) so colors, spacing and
   the gradient render exactly as in the original screens,
   regardless of which Tailwind utilities happen to be available
   in the preview environment.
   ============================================================ */
const STYLES = `
.tca{
  --purple-900:#2E1065; --purple-800:#3B0764; --purple-700:#5B21B6; --purple-600:#7C3AED;
  --purple-300:#C4B5FD; --purple-100:#F3E8FF; --purple-50:#FAF5FF;
  --ink-900:#1F2937; --ink-700:#374151; --ink-600:#4B5563; --ink-400:#9CA3AF;
  --line:#E7E7EA; --bg:#F7F7F8; --white:#FFFFFF; --mint:#10B981; --mint-bg:#ECFDF5; --mint-text:#047857;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.tca *{ box-sizing:border-box; }
.tca button{ font-family:inherit; }
.route-loading-state{min-height:100dvh;display:grid;place-content:center;justify-items:center;gap:14px;padding:28px;color:#5B21B6;font-size:13px;font-weight:600}
.route-loading-spinner{width:26px;height:26px;border:3px solid #E9DDF5;border-top-color:#6D28D9;border-radius:50%;animation:route-spin .8s linear infinite}
.route-loading-skeleton{display:grid;width:min(320px,70vw);gap:8px}
.route-loading-skeleton i{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#F1ECF8 25%,#E6DCF1 50%,#F1ECF8 75%);background-size:200% 100%;animation:route-shimmer 1.3s ease-in-out infinite}
.route-loading-skeleton i:nth-child(2){width:82%}
.route-loading-skeleton i:nth-child(3){width:64%}
@keyframes route-spin{to{transform:rotate(360deg)}}
@keyframes route-shimmer{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.route-loading-spinner,.route-loading-skeleton i{animation:none}}

/* ---------- Auth shells ---------- */
.tca-shell{ min-height:100vh; width:100%; display:grid; grid-template-columns:1fr 1fr; background:#fff; }
@media (max-width:1023px){ .tca-shell{ grid-template-columns:1fr; } .tca-left{ display:none; } }

.tca-left{ position:relative; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; padding:56px;
  background:linear-gradient(160deg, #6D28D9 0%, #4C1D95 42%, #2E1065 75%, #170729 100%); }
@media (min-width:1280px){ .tca-left{ padding:72px; } }
.tca-left-heading{ max-width:420px; }
.tca-left-heading h2{ color:#fff; font-size:28px; font-weight:700; line-height:1.3; margin:0 0 14px; }
.tca-left-heading p{ color:#DDD6FE; font-size:14px; line-height:1.6; margin:0; }

.tca-form-panel{ display:flex; align-items:center; justify-content:center; padding:56px 24px; }
@media (min-width:640px){ .tca-form-panel{ padding:56px 40px; } }
@media (min-width:1024px){ .tca-form-panel{ padding:56px 64px; } }
.tca-form-col{ width:100%; max-width:384px; }

.tca-logo{ display:flex; align-items:center; gap:9px; }
.tca-logo.center{ justify-content:center; margin-bottom:32px; }
.tca-logo .mark{ display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tca-logo .word{ font-weight:700; font-size:15px; letter-spacing:.2px; color:var(--ink-900); }

.tca-h1{ font-size:26px; font-weight:700; text-align:center; margin:0 0 6px; color:var(--ink-900); }
.tca-sub{ font-size:13.8px; color:var(--ink-600); text-align:center; margin:0 0 28px; line-height:1.55; }

.tca-field{ margin-bottom:16px; }
.tca-field label{ display:block; font-size:13.5px; color:var(--ink-700); margin-bottom:7px; }
.tca-field input, .tca-field textarea{
  width:100%; border:1px solid var(--line); border-radius:12px; padding:11px 15px; font-size:14px;
  color:var(--ink-900); outline:none; font-family:inherit; background:#fff; transition:border-color .15s ease, box-shadow .15s ease;
}
.tca-field input::placeholder, .tca-field textarea::placeholder{ color:#ADB2BC; }
.tca-field input:focus, .tca-field textarea:focus{ border-color:var(--purple-600); box-shadow:0 0 0 3px var(--purple-100); }
.tca-field textarea{ resize:none; min-height:96px; }

.tca-pwd-wrap{ position:relative; }
.tca-pwd-wrap input{ padding-right:44px; }
.tca-eye{ position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; display:flex; }

.tca-row-between{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:26px; }
.tca-checkbox{ display:flex; align-items:center; gap:8px; font-size:13.8px; color:var(--ink-600); cursor:pointer; user-select:none; }
.tca-checkbox input{ width:16px; height:16px; cursor:pointer; }
.tca-link{ background:none; border:none; padding:0; cursor:pointer; font-size:13.8px; font-weight:600; color:var(--purple-700); }
.tca-link:hover{ color:var(--purple-900); }

.tca-btn-primary{ width:100%; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:12px; padding:13px;
  font-size:14px; font-weight:600; cursor:pointer; transition:background .15s ease; background:var(--purple-800); color:#fff; }
.tca-btn-primary:hover{ background:var(--purple-900); }
.tca-btn-primary.disabled{ background:var(--purple-100); color:var(--purple-300); cursor:default; }
.tca-btn-primary.disabled:hover{ background:var(--purple-100); }

.tca-divider{ display:flex; align-items:center; gap:12px; margin:22px 0; }
.tca-divider .line{ height:1px; flex:1; background:var(--line); }
.tca-divider span{ font-size:12px; color:var(--ink-400); }

.tca-google-btn{ width:100%; display:flex; align-items:center; justify-content:center; gap:10px; border:1px solid var(--line); border-radius:12px;
  padding:12px; font-size:14px; font-weight:500; color:var(--ink-700); background:#fff; cursor:pointer; transition:background .15s ease; }
.tca-google-btn:hover{ background:var(--bg); }

.tca-footer-text{ text-align:center; font-size:13.8px; color:var(--ink-600); margin-top:24px; }

.tca-not-found{ min-height:100vh; display:grid; place-items:center; padding:24px; background:radial-gradient(circle at top, rgba(167,139,250,.20), rgba(255,255,255,0) 38%), linear-gradient(180deg, #F8F5FF 0%, #F5F7FB 100%); }
.tca-not-found-card{ width:min(100%, 620px); background:rgba(255,255,255,.82); border:1px solid #E9D5FF; border-radius:28px; padding:28px 24px 32px; text-align:center; box-shadow:0 24px 60px rgba(109,40,217,.10); }
.tca-not-found-illustration{ display:block; width:min(100%, 360px); height:auto; margin:0 auto 20px; }
.tca-not-found-card h1{ margin:0 0 10px; font-size:clamp(28px, 5vw, 44px); line-height:1.1; color:#1F2937; }
.tca-not-found-card p{ margin:0 auto 22px; max-width:480px; font-size:14px; line-height:1.6; color:#4B5563; }
.tca-empty-state-wrap{ display:flex; align-items:center; justify-content:center; grid-column:1/-1; min-height:calc(100dvh - 230px); padding:28px 20px 16px; }
.tca-empty-state-content{ width:min(100%, 520px); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:28px 18px 20px; }
.tcx .community-empty-state{display:flex;min-height:calc(100dvh - 300px);align-items:center;justify-content:center;text-align:center}
.tca-empty-state-illustration{ display:block; width:min(100%, 280px); height:auto; margin:0 auto 18px; animation:tca-float 3s ease-in-out infinite; }
.tca-empty-state-content h3{ margin:0 0 8px; color:var(--i9); font-size:clamp(20px, 2vw, 26px); }
.tca-empty-state-content p{ margin:0; color:var(--p6); font-size:14px; line-height:1.6; }
@keyframes tca-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }

.tca-backlink-row{ display:flex; justify-content:center; margin-top:24px; }
.tca-backlink{ display:flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; font-size:13.8px; font-weight:600; color:var(--purple-700); }
.tca-backlink:hover{ color:var(--purple-900); }

.tca-steps{ display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:22px; }
.tca-dot{ height:6px; width:6px; border-radius:999px; background:#D1D5DB; transition:all .15s ease; }
.tca-dot.active{ width:26px; background:var(--purple-700); }
.tca-steps .steplabel{ font-size:12px; color:var(--ink-400); font-weight:600; margin-left:8px; }

.tca-onboard{ min-height:100vh; background:var(--bg); }
.tca-onboard-top{ display:flex; align-items:center; justify-content:space-between; padding:20px 24px; }
@media (min-width:640px){ .tca-onboard-top{ padding:20px 40px; } }
.tca-skip{ background:none; border:none; cursor:pointer; font-size:13.8px; color:var(--ink-400); }
.tca-skip:hover{ color:var(--ink-600); }
.tca-onboard-body{ padding:8px 24px 60px; display:flex; justify-content:center; }
@media (min-width:640px){ .tca-onboard-body{ padding:8px 40px 60px; } }
.tca-onboard-col{ width:100%; max-width:700px; padding-top:20px; }

.tca-onboard-h1{ font-size:26px; font-weight:700; text-align:center; margin:0 0 8px; color:var(--ink-900); }
@media (min-width:640px){ .tca-onboard-h1{ font-size:30px; } }
.tca-onboard-sub{ font-size:14px; color:var(--ink-600); text-align:center; max-width:560px; margin:0 auto 32px; line-height:1.6; }

.tca-photo-wrap{ display:flex; flex-direction:column; align-items:center; margin-bottom:32px; }
.tca-photo-btn{ width:68px; height:68px; border-radius:50%; border:2px dashed var(--purple-300); background:var(--purple-50);
  display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; margin-bottom:10px; }
.tca-photo-btn:hover{ background:var(--purple-100); }
.tca-photo-btn img{ width:100%; height:100%; object-fit:cover; }
.tca-photo-label{ background:none; border:none; cursor:pointer; font-size:13.8px; font-weight:600; color:var(--purple-700); }

.tca-onboard-inner{ max-width:520px; margin:0 auto; }
.tca-onboard-inner.wide{ max-width:640px; }

.tca-fieldset-label{ display:block; font-size:13.5px; color:var(--ink-700); margin-bottom:9px; }
.tca-pills{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:18px; }
.tca-pills.center{ justify-content:center; }
.tca-pill{ display:inline-flex; align-items:center; gap:8px; border-radius:999px; border:1px solid var(--line); padding:10px 16px;
  font-size:13.8px; font-weight:500; color:var(--ink-700); background:#fff; cursor:pointer; transition:all .12s ease; }
.tca-pill:hover{ border-color:#D1D5DB; }
.tca-pill.selected{ border-color:var(--purple-600); background:var(--purple-50); color:var(--purple-800); font-weight:600; }
.tca-pill .radio-dot{ width:16px; height:16px; border-radius:50%; border:1.5px solid #D1D5DB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tca-pill.selected .radio-dot{ border-color:var(--purple-700); background:var(--purple-700); }
.tca-pill.selected .radio-dot .inner{ width:6px; height:6px; border-radius:50%; background:#fff; }

.tca-btn-row{ display:flex; gap:12px; margin-top:8px; }
@media (max-width:480px){ .tca-btn-row{ flex-direction:column; } }
.tca-btn-outline{ flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid var(--line); border-radius:12px;
  padding:13px; font-size:14px; font-weight:600; color:var(--purple-800); background:#fff; cursor:pointer; transition:background .15s ease; }
.tca-btn-outline:hover{ background:var(--bg); }
.tca-btn-row .tca-btn-primary{ flex:1; }

.tca-otp-row{ display:flex; gap:10px; justify-content:center; margin-bottom:26px; }
@media (min-width:480px){ .tca-otp-row{ gap:12px; } }
.tca-otp-box{ width:42px; height:50px; text-align:center; font-size:17px; font-weight:700; border:1px solid var(--line); border-radius:12px;
  outline:none; color:var(--ink-900); }
@media (min-width:480px){ .tca-otp-box{ width:48px; height:56px; } }
.tca-otp-box:focus{ border-color:var(--purple-600); box-shadow:0 0 0 3px var(--purple-100); }

.tca-mail-icon{ display:flex; justify-content:center; margin-bottom:18px; }
.tca-mail-icon span{ width:56px; height:56px; border-radius:50%; background:transparent; color:var(--purple-700); display:flex; align-items:center; justify-content:center; }

.tca-req-list{ display:flex; flex-direction:column; gap:9px; margin:2px 0 24px; }
.tca-req-item{ display:flex; align-items:center; gap:9px; font-size:12.8px; }
.tca-req-dot{ width:16px; height:16px; border-radius:50%; border:1.5px solid #D1D5DB; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tca-req-dot.met{ background:var(--mint); border-color:var(--mint); }
.tca-req-item .txt{ color:var(--ink-400); }
.tca-req-item .txt.met{ color:var(--ink-700); }

.tca-success-h1{ font-size:26px; font-weight:700; text-align:center; margin:0 0 12px; color:var(--ink-900); }
.tca-success-sub{ font-size:14px; color:var(--ink-600); text-align:center; line-height:1.65; margin:0 0 28px; }

.tca-logo-img{ display:block; height:18px; width:auto; max-width:100%; }
.tca-logo.center .tca-logo-img{ margin:0 auto; }
.tca-mockup-wrap{ display:flex; justify-content:center; }
.tca-mockup{ display:block; width:100%; max-width:520px; height:auto; }
.dash-logo-crop{ display:block; width:155px; height:18px; overflow:hidden; flex-shrink:0; }
.dash-logo-img{ display:block; width:155px; height:18px; max-width:none; }
.dash-sidebar.collapsed .dash-logo-crop{ width:19px; }
@media (max-width:1023px){ .dash-sidebar .dash-logo-crop{ width:19px; } .dash-sidebar.open .dash-logo-crop{ width:155px; } }
.tca-mock-card{ background:#fff; border-radius:18px; box-shadow:0 24px 60px rgba(0,0,0,.3); padding:12px; width:280px; }
@media (min-width:1280px){ .tca-mock-card{ width:308px; } }
.tca-mock-top{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:0 3px; }
.tca-mock-top .l{ display:flex; align-items:center; gap:6px; }
.tca-mock-top .r{ display:flex; align-items:center; gap:6px; }
.tca-mbar{ background:#E5E7EB; border-radius:999px; height:6px; }
.tca-mock-banner{ background:#374151; border-radius:10px; padding:12px; margin-bottom:9px; }
.tca-mock-banner .b1{ background:#9CA3AF; height:6px; width:60%; border-radius:999px; margin-bottom:7px; }
.tca-mock-banner .b2{ background:#6B7280; height:6px; width:82%; border-radius:999px; margin-bottom:10px; }
.tca-mock-pills{ display:flex; gap:5px; }
.tca-mock-pills span{ background:rgba(255,255,255,.8); height:8px; width:30px; border-radius:999px; }
.tca-mock-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:9px; }
.tca-mock-stat{ background:#F9FAFB; border-radius:8px; padding:6px; }
.tca-mock-stat .a{ background:#D1D5DB; height:4px; width:60%; border-radius:999px; margin-bottom:5px; }
.tca-mock-stat .b{ background:#9CA3AF; height:6px; width:75%; border-radius:999px; }
.tca-mock-cards{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.tca-mock-mini{ background:#F9FAFB; border-radius:8px; padding:6px; }
.tca-mock-mini .dot{ width:11px; height:11px; border-radius:4px; margin-bottom:5px; }
.tca-mock-mini .a{ background:#D1D5DB; height:4px; width:100%; border-radius:999px; margin-bottom:4px; }
.tca-mock-mini .b{ background:#E5E7EB; height:4px; width:65%; border-radius:999px; }

.tca-toast{ position:fixed; bottom:22px; right:22px; z-index:100; max-width:300px; background:#fff; border:1px solid var(--line);
  border-radius:14px; box-shadow:0 16px 34px rgba(17,17,20,.16); padding:13px 16px; display:flex; align-items:center; gap:11px;
  transition:all .2s ease; opacity:0; transform:translateY(12px); pointer-events:none; }
.tca-toast.show{ opacity:1; transform:translateY(0); }
.tca-toast .chip{ width:30px; height:30px; border-radius:8px; background:transparent; color:var(--purple-700); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tca-toast .msg{ font-size:12.8px; font-weight:600; color:#1F2937; }

/* ---------- Dashboard shell ---------- */
.dash-app{ display:flex; min-height:100vh; background:var(--bg); }
.dash-sidebar{ width:260px; flex-shrink:0; background:#fff; border-right:1px solid var(--line); padding:22px 16px; display:flex; flex-direction:column; position:relative; z-index:1; }
.dash-brand{ display:flex; align-items:center; gap:9px; padding:0 6px 22px; font-weight:700; font-size:15px; color:var(--ink-900); }
.dash-brand .mark{ display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.dash-brand .word{ text-transform:uppercase; letter-spacing:.03em; font-size:15.5px; }
.dash-navgroup{ margin-bottom:18px; }
.dash-navlabel{ font-size:11px; color:var(--ink-400); font-weight:600; letter-spacing:.06em; padding:0 10px 8px; }
.dash-navitem{ display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:9px; color:var(--ink-600); font-size:14px; text-decoration:none; margin-bottom:2px; background:none; border:none; width:100%; text-align:left; cursor:pointer; position:relative; }
.dash-navitem.active{ background:var(--purple-50); color:var(--purple-700); font-weight:600; }
.dash-navitem:not(.active):hover{ background:#FAFAFA; }
.dash-sidebar-bottom{ margin-top:auto; }

.dash-main{ flex:1; min-width:0; }
.dash-topbar{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 32px; background:#fff; border-bottom:1px solid var(--line); position:relative; z-index:1; }
@media (max-width:640px){ .dash-topbar{ padding:16px; } }
.dash-searchbar{ flex:1; max-width:460px; display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 14px; color:var(--ink-400); font-size:13.5px; }
.dash-topbar-right{ display:flex; align-items:center; gap:16px; flex-shrink:0; }
.dash-avatar{ width:30px; height:30px; border-radius:50%; background:var(--purple-700); color:#fff; font-size:12.5px; font-weight:600; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.dash-avatar img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}
.dash-bell-wrap{ position:relative; display:inline-flex; }
.dash-bell-count{ position:absolute; top:-8px; right:-11px; min-width:17px; height:17px; padding:0 4px; border:2px solid #fff; border-radius:999px; background:#B42318; color:#fff; display:grid; place-items:center; font-size:9px; font-weight:800; line-height:1; }

.dash-content{ padding:28px 32px 60px; max-width:1180px; }
@media (max-width:640px){ .dash-content{ padding:20px; } }
.learning-hub-main{display:flex;flex-direction:column;min-height:100dvh}
.learning-hub-content{display:flex;flex:1;min-height:0;max-width:none!important;padding:0!important;overflow:hidden}
.learning-hub-shell{display:flex;flex:1;min-width:0;min-height:0;width:100%}
.dash-banner{ background:linear-gradient(120deg,var(--purple-700) 0%, var(--purple-900) 100%); border-radius:16px; padding:28px 32px; color:#fff; margin-bottom:26px; }
@media (max-width:640px){ .dash-banner{ padding:22px; } }
.dash-banner .eyebrow{ font-size:11.5px; letter-spacing:.08em; color:#D8B4FE; font-weight:600; margin-bottom:10px; }
.dash-banner h1{ font-size:24px; margin:0 0 8px; font-weight:700; }
.dash-banner p{ margin:0 0 16px; color:#E9D5FF; font-size:14px; max-width:560px; line-height:1.6; }
.dash-pillrow{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dash-pill{ background:rgba(255,255,255,.16); color:#fff; font-size:12.5px; padding:5px 12px; border-radius:999px; }
.dash-arrowsep{ color:#C4B5FD; font-size:13px; }

.dash-page-head h1{ font-size:23px; margin:0 0 6px; color:var(--ink-900); font-weight:700; }
.dash-page-head p{ font-size:13.5px; color:var(--ink-600); margin:0 0 22px; }

.dash-section-title{ font-size:17px; margin:0 0 4px; font-weight:700; color:var(--ink-900); }
.dash-section-sub{ font-size:13.5px; color:var(--ink-600); margin:0 0 16px; }

.dash-stats-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:22px; }
@media (max-width:900px){ .dash-stats-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:480px){ .dash-stats-grid{ grid-template-columns:1fr; } }
.dash-stat-card{ background:#fff; border:1px solid var(--line); border-radius:13px; padding:16px 18px; }
.dash-stat-card .label{ font-size:12.5px; color:var(--ink-600); margin-bottom:8px; }
.dash-stat-card .value{ font-size:24px; font-weight:700; margin-bottom:8px; color:var(--ink-900); }
.dash-stat-skeleton{display:block;width:76px;height:26px;border-radius:6px;background:linear-gradient(90deg,#F1ECF8 25%,#E6DCF1 50%,#F1ECF8 75%);background-size:200% 100%;animation:route-shimmer 1.3s ease-in-out infinite}
.dash-stat-empty{font-size:12px;font-weight:500;color:var(--ink-400)}
.dash-tag-mint{ display:inline-block; background:var(--mint-bg); color:var(--mint-text); font-size:11.5px; padding:2px 8px; border-radius:999px; font-weight:600; }

.dash-cards-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media (max-width:900px){ .dash-cards-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .dash-cards-grid{ grid-template-columns:1fr; } }
.dash-action-card{ background:#fff; border:1px solid var(--line); border-radius:13px; padding:18px; }
.dash-action-card .chip{ width:34px; height:34px; border-radius:9px; background:transparent; color:var(--purple-700); display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
.dash-action-card h3{ font-size:14.5px; margin:0 0 6px; font-weight:600; color:var(--ink-900); }
.dash-action-card p{ font-size:13px; color:var(--ink-600); line-height:1.5; margin:0 0 12px; }
.dash-action-card a{ font-size:13px; color:var(--purple-600); font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:4px; cursor:pointer; }

.dash-notsure{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px;margin-top:0}
.dash-notsure h3{font-size:16px;margin:0 0 4px;font-weight:700;color:var(--ink-900)}
.dash-notsure>p{font-size:13.5px;color:var(--ink-600);margin:0 0 18px}
.dash-notsure-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
@media (max-width:900px){ .dash-notsure-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:600px){ .dash-notsure-grid{ grid-template-columns:1fr; } }
.dash-mini-card{display:flex;flex-direction:column;align-items:flex-start;width:100%;min-height:0;padding:14px 16px;border:1px solid var(--line);border-radius:10px;text-align:left;background:#fff;font:inherit;cursor:pointer;transition:border-color .16s ease,transform .16s ease}
.dash-mini-card:hover{border-color:#7C3AED;transform:translateY(-2px)}
.dash-mini-card:focus-visible{outline:3px solid #C4B5FD;outline-offset:2px}
.dash-mini-card .q{font-size:13.5px;font-weight:700;color:var(--ink-900);margin:0 0 4px}
.dash-mini-card .a{font-size:13px;color:var(--ink-600);margin:0 0 6px}
.dash-mini-card .l{font-size:12.8px;color:var(--purple-600);font-weight:600;display:inline-flex;align-items:center;gap:4px}
.dash-contact{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:22px;padding:18px 20px;border-top:1px solid var(--line);color:var(--ink-600)}
.dash-contact h3{margin:0 0 4px;color:var(--ink-900);font-size:14px}
.dash-contact p{margin:0;font-size:13px}
.dash-contact a{display:inline-flex;align-items:center;gap:8px;color:#5B21B6;font-size:13px;font-weight:600;text-decoration:none;overflow-wrap:anywhere}
.restored-homepage-hero{aspect-ratio:3.36/1;padding:0!important;margin-bottom:26px;overflow:hidden;border-radius:14px;background:#F3E8FF}
.restored-homepage-hero img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
@media(max-width:760px){.restored-homepage-hero{aspect-ratio:2.7/1}.restored-homepage-hero img{object-fit:contain;background:#F7F7F8}}
@media(max-width:480px){.restored-homepage-hero{aspect-ratio:2.3/1}}
.forum-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:32px;align-items:center;margin:0 0 30px;padding:30px 34px;border-radius:14px;background:transparent;color:#2E1065}
.forum-hero-copy{max-width:590px}
.forum-hero-eyebrow{margin:0 0 14px!important;color:#5B21B6;font-size:11px;font-weight:700;letter-spacing:.08em}
.forum-hero h1{margin:0 0 12px!important;color:#2E1065;font-size:30px;line-height:1.18}
.forum-hero-copy>p:not(.forum-hero-eyebrow){margin:0;color:#4B5563;font-size:14px;line-height:1.7}
.forum-hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.forum-hero .forum-messaging-action{background:#fff;border:1px solid #C4B5FD;color:#5B21B6}
.forum-hero .forum-messaging-action:hover{background:#FAF5FF}
.forum-visual{width:min(100%,340px);min-width:0;border-radius:10px;background:#2E1065;padding:22px 24px}
.forum-visual-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;color:#fff;font-size:13px;font-weight:700}
.forum-live-tag{padding:4px 8px;border-radius:5px;background:#fff;color:#5B21B6;font-size:10px;font-weight:700;text-transform:uppercase}
.forum-visual-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.18)}
.forum-visual-index{display:block;width:auto;height:auto;flex:0 0 auto;border-radius:0;background:none;color:#D8B4FE;font-size:12px;font-weight:800}
.forum-visual-row strong{display:block;margin-bottom:3px;color:#fff;font-size:13px}
.forum-visual-row small{display:block;color:#E9D5FF;font-size:12px;line-height:1.45}
.forum-visual-foot{display:flex;gap:22px;padding-top:14px;color:#E9D5FF;font-size:12px}
.forum-visual-foot strong{color:#fff;font-size:14px}
.forum-filters{margin-bottom:24px}
.forum-filter-label{width:100%;margin:0 0 2px;color:#4B5563;font-size:12px;font-weight:700}
.forum-post{padding:28px!important;border-radius:12px!important;transition:border-color .18s ease,box-shadow .18s ease}
.forum-post:hover{border-color:#C4B5FD;box-shadow:0 10px 26px rgba(46,16,101,.07)}
.forum-post .disc-title-btn h3{font-size:17px!important;line-height:1.4}
.forum-rail .forum-topic-panel{background:#FAF5FF;border-color:#E9D5FF}
.forum-rail .forum-member-panel{background:#fff;border-color:#E9D5FF}
.forum-topic-row{padding:9px 0;border-bottom:1px solid rgba(91,33,182,.1)}
.forum-topic-row:last-child{border-bottom:0}
.forum-topic-swatch{width:9px;height:9px;flex:0 0 9px;border-radius:2px;background:#7C3AED}
.forum-topic-row:nth-child(3n) .forum-topic-swatch,.forum-topic-row:nth-child(3n + 1) .forum-topic-swatch{background:#5B21B6}
.forum-empty-state{display:flex;width:min(100%,760px);min-height:260px;align-self:center;flex-direction:column;align-items:center;justify-content:center;gap:12px;border-color:#DDD6FE!important;background:#FAF5FF!important;text-align:center}
.forum-empty-icon{display:grid;place-items:center;width:54px;height:54px;border-radius:12px;background:#EDE9FE}
.forum-empty-state strong{color:#2E1065;font-size:16px}
@media(max-width:760px){.forum-hero{grid-template-columns:1fr;gap:26px;padding:26px 22px}.forum-visual{width:100%;padding:18px}.forum-hero h1{font-size:25px}}
@media(max-width:480px){.forum-visual-foot{gap:14px}.forum-post{padding:20px!important}}
.submit-project-page{max-width:820px;margin:0 auto;padding:28px 0}
.submit-project-heading{margin-bottom:24px}
.submit-project-heading>span{font-size:11px;font-weight:700;letter-spacing:.08em;color:#5B21B6}
.submit-project-heading h1{margin:8px 0;font-size:26px;color:var(--ink-900)}
.submit-project-heading p{margin:0;color:var(--ink-600);font-size:14px;line-height:1.55}
.submit-project-form{display:grid;gap:18px;padding:24px;background:#fff;border:1px solid var(--line);border-radius:12px}
.submit-project-form label{display:grid;gap:7px;color:var(--ink-700);font-size:13px;font-weight:600}
.submit-project-form input,.submit-project-form select,.submit-project-form textarea{width:100%;min-width:0;border:1px solid #D0D5DD;border-radius:7px;padding:11px 12px;color:var(--ink-900);font:inherit;font-size:14px;background:#fff}
.submit-project-form textarea{resize:vertical;line-height:1.5}
.submit-project-form input:focus,.submit-project-form select:focus,.submit-project-form textarea:focus{outline:3px solid #E9DDF5;border-color:#7C3AED}
.submit-project-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.submit-project-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-top:4px}
.submit-project-actions p{margin:0;color:var(--ink-600);font-size:12px;line-height:1.5}
.submit-project-actions button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 16px;border:0;border-radius:7px;background:#5B21B6;color:#fff;font:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
.submit-project-actions button:hover{background:#3B0764}
@media(max-width:600px){.dash-contact,.submit-project-actions{align-items:flex-start;flex-direction:column}.submit-project-row{grid-template-columns:1fr}.submit-project-form{padding:18px}.submit-project-page{padding:18px 0}}

.dash-footer-tag{ text-align:center; color:var(--ink-400); font-size:13px; margin-top:36px; }

/* ---------- Tour overlay ---------- */
.tour-click-block{ position:fixed; inset:0; z-index:70; background:transparent; }
.tour-dim{ position:fixed; z-index:69; background:rgba(15,10,25,.4); transition:all .18s ease; }
.tour-card{ position:fixed; z-index:71; width:410px; max-width:92vw; box-sizing:border-box; background:#fff; border:1px solid #E5E7EB; border-radius:8px; box-shadow:0 8px 30px rgba(20,10,40,.18); padding:60px 21px 22px; }
.tour-pointer{ position:absolute; left:-8px; width:16px; height:16px; background:#fff; transform:translateY(-50%) rotate(45deg); box-shadow:-3px 3px 6px rgba(20,10,40,.06); }
.tour-close{ position:absolute; top:21px; right:21px; width:24px; height:24px; border-radius:50%; background:#8F9BB3; border:0; padding:0; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.tour-close:hover{ background:#6F7C96; }
.tour-top-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.tour-step-label{ font-size:12px; font-weight:500; color:var(--purple-700); }
.tour-skip{ font-size:12px; color:#9CA3AF; background:none; border:none; padding:0; cursor:pointer; font-family:inherit; }
.tour-skip:hover{ color:var(--ink-600); }
.tour-icon{ color:var(--purple-700); margin-bottom:8px; }
.tour-icon.emoji{ font-size:24px; line-height:1; }
.tour-title{ font-size:16px; font-weight:500; margin:0 0 8px; color:var(--ink-900); }
.tour-desc{ font-size:13.5px; color:#6B7280; line-height:20px; margin:0 0 30px; min-height:60px; }
.tour-bottom-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.tour-dots{ display:flex; align-items:center; gap:4px; }
.tour-dot{ width:3px; height:3px; border-radius:999px; background:#D1D5DB; }
.tour-dot.active{ width:12px; height:3px; background:var(--purple-700); }
.tour-btns{ display:flex; gap:8px; }
.tour-back-btn{ display:flex; align-items:center; gap:8px; height:40px; background:#fff; border:1px solid var(--line); color:var(--ink-700); border-radius:6px; padding:0 16px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; }
.tour-back-btn:hover{ background:var(--bg); }
.tour-next-btn{ display:flex; align-items:center; justify-content:center; gap:8px; height:40px; min-width:95px; background:var(--purple-700); border:none; color:#fff; border-radius:6px; padding:0 18px; font-size:14px; font-weight:500; cursor:pointer; font-family:inherit; }
.tour-next-btn:hover{ background:var(--purple-800); }

/* ---------- Generic modal ---------- */
.modal-overlay{ position:fixed; inset:0; background:rgba(17,17,20,.45); display:flex; align-items:center; justify-content:center; padding:20px; z-index:90; }
.modal-card{ background:#fff; border-radius:16px; padding:26px; width:100%; max-width:440px; max-height:85vh; overflow-y:auto; position:relative; }
.modal-close-x{ position:absolute; top:16px; right:16px; width:32px; height:32px; border-radius:50%; background:#94A3B8; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s ease; }
.modal-close-x:hover{ background:#7C8CA3; }
.modal-card h2{ font-size:17px; margin:0 0 4px; color:var(--ink-900); }
.modal-card .sub{ font-size:12.8px; color:var(--ink-600); margin:0 0 4px; }

/* ---------- Learning: list page ---------- */
.learn-continue-banner{ background:linear-gradient(120deg,var(--purple-700),var(--purple-900)); border-radius:16px; padding:24px 28px; color:#fff; margin-bottom:22px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.learn-continue-banner .eyebrow{ font-size:11px; letter-spacing:.08em; color:#D8B4FE; font-weight:700; margin-bottom:8px; }
.learn-continue-banner h3{ font-size:19px; margin:0 0 4px; }
.learn-continue-banner .sub{ font-size:13px; color:#E9D5FF; margin-bottom:12px; }
.learn-continue-banner .bar{ height:6px; background:rgba(255,255,255,.25); border-radius:999px; width:340px; max-width:100%; overflow:hidden; margin-bottom:6px; }
.learn-continue-banner .bar span{ display:block; height:100%; background:#fff; border-radius:999px; }
.learn-continue-banner .pct{ font-size:12px; color:#E9D5FF; }
.learn-resume-btn{ background:#fff; color:var(--purple-700); border:none; border-radius:10px; padding:11px 20px; font-weight:700; font-size:13.5px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; flex-shrink:0; }

.learn-filters{ display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:20px; flex-wrap:wrap; }
.learn-pill-row{ display:flex; gap:8px; flex-wrap:wrap; }
.learn-fpill{ background:#fff; border:1px solid var(--line); color:var(--ink-600); font-size:13px; padding:8px 16px; border-radius:999px; cursor:pointer; font-weight:500; }
.learn-fpill.active{ background:var(--purple-700); border-color:var(--purple-700); color:#fff; }
.learn-sort{ position:relative; }
.learn-sort-btn{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 14px; font-size:13px; cursor:pointer; color:var(--ink-700); }
.learn-sort-menu{ position:absolute; top:calc(100% + 6px); right:0; background:#fff; border:1px solid var(--line); border-radius:10px; box-shadow:0 14px 30px rgba(17,17,20,.12); padding:6px; min-width:140px; z-index:10; }
.learn-sort-option{ padding:8px 10px; font-size:13px; border-radius:7px; cursor:pointer; color:var(--ink-700); }
.learn-sort-option:hover{ background:var(--bg); }
.learn-sort-option.active{ color:var(--purple-700); font-weight:600; }

.learn-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
@media (max-width:960px){ .learn-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:640px){ .learn-grid{ grid-template-columns:1fr; } }
.learn-card{ background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; cursor:pointer; display:flex; flex-direction:column; transition:box-shadow .15s ease, transform .15s ease; }
.learn-card:hover{ box-shadow:0 10px 24px rgba(17,17,20,.08); transform:translateY(-2px); }
.learn-thumb{ height:150px; }
.learn-card-body{ padding:16px 18px; flex:1; display:flex; flex-direction:column; }
.learn-topic-pill{ align-self:flex-start; background:var(--purple-100); color:var(--purple-700); font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; margin-bottom:9px; }
.learn-card-body h3{ font-size:15px; margin:0 0 7px; color:var(--ink-900); }
.learn-card-body p{ font-size:12.8px; color:var(--ink-600); line-height:1.5; margin:0 0 12px; flex:1; }
.learn-card-meta{ display:flex; gap:14px; font-size:12px; color:var(--ink-400); margin-bottom:14px; }
.learn-card-meta span{ display:flex; align-items:center; gap:5px; }
.learn-card-progress{ display:flex; align-items:center; justify-content:space-between; gap:10px; border-top:1px solid var(--line); padding-top:12px; }
.learn-card-progress .txt{ font-size:12px; color:var(--ink-600); margin-bottom:5px; }
.learn-card-progress .bar{ height:5px; background:var(--line); border-radius:999px; width:100px; overflow:hidden; }
.learn-card-progress .bar span{ display:block; height:100%; background:var(--purple-700); border-radius:999px; }
.learn-card-btn{ font-size:12.5px; font-weight:700; padding:7px 14px; border-radius:8px; border:1px solid var(--line); background:#fff; color:var(--purple-700); cursor:pointer; flex-shrink:0; }
.learn-empty{ grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--ink-400); font-size:13.5px; }

/* ---------- Learning: course detail ---------- */
.learn-back{ display:flex; align-items:center; gap:7px; background:none; border:none; color:var(--purple-700); font-weight:600; font-size:13.5px; cursor:pointer; margin-bottom:16px; }

.course-layout{ display:flex; gap:20px; align-items:flex-start; }
@media (max-width:960px){ .course-layout{ flex-direction:column; } }
.course-main{ flex:1; min-width:0; width:100%; }
.course-sidebar{ width:300px; flex-shrink:0; display:flex; flex-direction:column; gap:14px; }
@media (max-width:960px){ .course-sidebar{ width:100%; } }

.video-player{ position:relative; border-radius:14px; overflow:hidden; background:#111; }
.video-player.fs{ border-radius:0; height:100vh; display:flex; flex-direction:column; }
.video-player.fs .video-visual{ flex:1; aspect-ratio:auto; }
.video-visual{ position:relative; aspect-ratio:16/8.4; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.video-play-btn{ width:54px; height:54px; border-radius:50%; background:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,.25); z-index:2; }
.video-complete-badge{ text-align:center; z-index:2; }
.video-complete-badge .ico{ width:48px; height:48px; border-radius:50%; background:var(--mint); display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
.video-complete-badge .t{ color:#fff; font-weight:700; font-size:15px; margin-bottom:3px; }
.video-complete-badge .s{ color:#E5E7EB; font-size:12.5px; }
.video-controls{ display:flex; align-items:center; gap:12px; background:#000; padding:10px 16px; }
.vc-btn{ background:none; border:none; cursor:pointer; display:flex; padding:2px; flex-shrink:0; }
.vc-time{ color:#fff; font-size:12px; white-space:nowrap; flex-shrink:0; }
.vc-track{ flex:1; height:4px; background:rgba(255,255,255,.25); border-radius:999px; cursor:pointer; position:relative; }
.vc-fill{ height:100%; border-radius:999px; }
.vc-volume-wrap{ position:relative; display:flex; align-items:center; }
.vc-volume-slider{ width:70px; margin-left:6px; accent-color:#fff; }

.course-complete-banner{ display:flex; align-items:center; gap:12px; background:var(--mint-bg); border:1px solid #A7F3D0; border-radius:12px; padding:14px 18px; margin-top:16px; }
.course-complete-banner .ico{ width:30px; height:30px; border-radius:50%; background:var(--mint); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.course-complete-banner .t{ font-size:13.5px; font-weight:700; color:var(--mint-text); }
.course-complete-banner .s{ font-size:12.3px; color:#059669; }

.course-info-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:26px 28px; margin-top:16px; }
.course-info-card .topic-pill{ display:inline-block; background:var(--purple-100); color:var(--purple-700); font-size:11.5px; font-weight:700; padding:3px 11px; border-radius:999px; margin-bottom:12px; }
.course-info-card h1{ font-size:24px; margin:0 0 8px; color:var(--ink-900); }
.course-info-card .meta{ font-size:12.5px; color:var(--ink-400); margin-bottom:18px; }
.course-info-card > p{ font-size:14px; color:var(--ink-700); line-height:1.7; margin:0 0 18px; }
.course-info-card h4{ font-size:15.5px; margin:0 0 10px; color:var(--ink-900); }
.takeaways-box{ background:var(--purple-50); border-radius:12px; padding:18px 20px; margin-bottom:20px; }
.takeaways-box .tk-title{ font-size:13px; font-weight:700; color:var(--purple-800); margin-bottom:10px; }
.takeaways-box ul{ margin:0; padding-left:18px; }
.takeaways-box li{ font-size:13.5px; color:var(--ink-700); line-height:1.7; }

.lesson-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; }
.lesson-card h3{ font-size:15px; margin:0 0 12px; color:var(--ink-900); }
.lesson-progress-row{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
.lesson-progress-row .bar{ flex:1; height:6px; background:var(--line); border-radius:999px; overflow:hidden; }
.lesson-progress-row .bar span{ display:block; height:100%; background:var(--purple-700); border-radius:999px; transition:width .3s ease; }
.lesson-progress-row .pct{ font-size:11.5px; color:var(--ink-400); font-weight:600; }
.lesson-count-text{ font-size:12px; color:var(--ink-400); margin-bottom:16px; }
.lesson-list{ list-style:none; margin:0; padding:0; }
.lesson-list li{ display:flex; align-items:center; gap:11px; padding:10px 8px; border-radius:9px; font-size:13.2px; color:var(--ink-400); }
.lesson-list li .num{ width:22px; height:22px; border-radius:50%; background:var(--bg); color:var(--ink-400); font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.lesson-list li.done{ color:var(--ink-700); }
.lesson-list li.done .num{ background:var(--mint); color:#fff; }
.lesson-list li.current{ background:var(--purple-50); color:var(--purple-800); font-weight:700; }
.lesson-list li.current .num{ background:var(--purple-700); color:#fff; }

.related-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; }
.related-card h4{ font-size:14px; margin:0 0 14px; color:var(--ink-900); }
.related-item{ display:block; width:100%; text-align:left; background:none; border:none; padding:0; cursor:pointer; margin-bottom:14px; }
.related-item:last-child{ margin-bottom:0; }
.related-item .rt{ font-size:13px; font-weight:600; color:var(--ink-900); margin-bottom:2px; }
.related-item .rs{ font-size:11.6px; color:var(--ink-400); }
.related-item:hover .rt{ color:var(--purple-700); }

.course-action-bar{ position:sticky; bottom:16px; margin-top:20px; margin-left:auto; width:fit-content; background:#fff; border-radius:14px; box-shadow:0 16px 34px rgba(17,17,20,.16); padding:14px 16px; display:flex; gap:10px; z-index:5; }
@media (max-width:960px){ .course-action-bar{ width:100%; margin-left:0; position:static; } }
.btn-primary-lg{ background:var(--purple-700); color:#fff; border:none; border-radius:10px; padding:11px 22px; font-size:13.8px; font-weight:700; cursor:pointer; }
.btn-primary-lg:hover{ background:var(--purple-800); }
.btn-outline-lg{ background:#fff; color:var(--ink-700); border:1px solid var(--line); border-radius:10px; padding:11px 20px; font-size:13.8px; font-weight:600; cursor:pointer; }
.btn-outline-lg:hover{ background:var(--bg); }

.review-modal-list{ display:flex; flex-direction:column; gap:10px; margin:16px 0 20px; }
.review-modal-item{ display:flex; align-items:center; gap:10px; font-size:13.5px; color:var(--ink-700); }
.review-modal-item .ico{ width:20px; height:20px; border-radius:50%; background:var(--mint); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

/* ---------- Events: list page ---------- */
.ev-empty-card{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:80px 40px; text-align:center; }
.ev-empty-icon{ width:64px; height:64px; border-radius:50%; background:transparent; color:var(--purple-700); display:flex; align-items:center; justify-content:center; margin:0 auto 22px; }
.ev-empty-card h3{ font-size:19px; margin:0 0 10px; color:var(--ink-900); }
.ev-empty-card p{ font-size:13.8px; color:var(--ink-600); max-width:460px; margin:0 auto 24px; line-height:1.6; }
.ev-empty-btns{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

.ev-nextup-banner{ background:linear-gradient(120deg,var(--purple-700),var(--purple-900)); border-radius:16px; padding:24px 28px; color:#fff; margin-bottom:22px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.ev-nextup-banner .eyebrow{ font-size:11px; letter-spacing:.08em; color:#D8B4FE; font-weight:700; margin-bottom:8px; }
.ev-nextup-banner h3{ font-size:19px; margin:0 0 4px; }
.ev-nextup-banner .sub{ font-size:13px; color:#E9D5FF; }
.ev-nextup-actions{ display:flex; gap:10px; flex-shrink:0; }
.ev-btn-white{ background:#fff; color:var(--purple-700); border:none; border-radius:10px; padding:11px 20px; font-weight:700; font-size:13.5px; cursor:pointer; }
.ev-btn-whiteline{ background:transparent; color:#fff; border:1px solid rgba(255,255,255,.5); border-radius:10px; padding:11px 20px; font-weight:600; font-size:13.5px; cursor:pointer; }

.ev-list{ display:flex; flex-direction:column; gap:14px; }
.ev-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px 20px; display:flex; align-items:center; gap:18px; }
@media (max-width:700px){ .ev-card{ flex-wrap:wrap; } }
.ev-date-box{ width:56px; flex-shrink:0; text-align:center; border:1px solid var(--line); border-radius:10px; padding:8px 4px; background:var(--purple-50); }
.ev-date-box .m{ font-size:10.5px; font-weight:700; color:var(--purple-700); letter-spacing:.04em; }
.ev-date-box .d{ font-size:19px; font-weight:700; color:var(--ink-900); }
.ev-card-body{ flex:1; min-width:0; }
.ev-type-pill{ display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; margin-bottom:7px; }
.ev-card-body h3{ font-size:15.5px; margin:0 0 4px; color:var(--ink-900); }
.ev-card-host{ font-size:12.5px; color:var(--ink-600); margin-bottom:8px; }
.ev-card-meta{ display:flex; gap:16px; font-size:12px; color:var(--ink-400); flex-wrap:wrap; }
.ev-card-meta span{ display:flex; align-items:center; gap:5px; }
.ev-card-actions{ flex-shrink:0; }
.ev-registered-pill{ display:inline-flex; align-items:center; gap:6px; background:var(--mint-bg); color:var(--mint-text); border:1px solid #A7F3D0; border-radius:10px; padding:10px 16px; font-size:13px; font-weight:700; }
.ev-register-btn{ background:var(--purple-700); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-size:13.3px; font-weight:700; cursor:pointer; }
.ev-register-btn:hover{ background:var(--purple-800); }

.ev-sidebar{ display:flex; flex-direction:column; gap:14px; }
.ev-side-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px 20px; }
.ev-side-card h4{ font-size:14px; margin:0 0 14px; color:var(--ink-900); display:flex; align-items:center; justify-content:space-between; }
.ev-side-card h4 a{ font-size:12px; color:var(--purple-600); font-weight:600; cursor:pointer; }
.ev-reg-item{ display:flex; gap:10px; margin-bottom:12px; }
.ev-reg-item:last-child{ margin-bottom:0; }
.ev-reg-item .db{ width:34px; text-align:center; border:1px solid var(--line); border-radius:7px; padding:3px 0; flex-shrink:0; }
.ev-reg-item .db .m{ font-size:8.5px; font-weight:700; color:var(--purple-700); }
.ev-reg-item .db .d{ font-size:13px; font-weight:700; color:var(--ink-900); }
.ev-reg-item .t{ font-size:12.5px; font-weight:600; color:var(--ink-900); margin-bottom:2px; }
.ev-reg-item .s{ font-size:11.5px; color:var(--ink-400); }
.ev-reg-empty{ font-size:12.5px; color:var(--ink-400); }
.ev-host-item{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.ev-host-item:last-child{ margin-bottom:0; }
.ev-host-item .ava{ width:32px; height:32px; border-radius:50%; color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ev-host-item .hn{ font-size:12.8px; font-weight:600; color:var(--ink-900); }
.ev-host-item .hr{ font-size:11.5px; color:var(--ink-400); }
.ev-follow-btn{ margin-left:auto; background:var(--purple-50); color:var(--purple-700); border:none; font-size:11.5px; font-weight:700; padding:6px 12px; border-radius:999px; cursor:pointer; flex-shrink:0; }
.ev-follow-btn.following{ background:var(--bg); color:var(--ink-400); }
.ev-info-purple{ background:var(--purple-50); border:1px solid var(--purple-100); }
.ev-info-purple h4{ color:var(--purple-900); }
.ev-info-purple p{ font-size:12.6px; color:var(--ink-600); margin:0 0 8px; line-height:1.55; }
.ev-info-purple a{ font-size:12.8px; color:var(--purple-700); font-weight:700; cursor:pointer; }

/* ---------- Events: detail page ---------- */
.ev-hero{ border-radius:14px; height:280px; margin-bottom:18px; position:relative; overflow:hidden; }
.ev-detail-badges{ display:flex; gap:8px; margin-bottom:14px; }
.ev-badge{ font-size:11.5px; font-weight:700; padding:4px 12px; border-radius:999px; }
.ev-detail-title{ font-size:26px; margin:0 0 16px; color:var(--ink-900); }
.ev-host-row{ display:flex; align-items:center; gap:10px; padding-bottom:18px; border-bottom:1px solid var(--line); margin-bottom:20px; }
.ev-verified-pill{ display:inline-flex; align-items:center; gap:4px; background:var(--mint-bg); color:var(--mint-text); font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
.ev-meta-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
@media (max-width:700px){ .ev-meta-grid{ grid-template-columns:1fr 1fr; } }
.ev-meta-grid .lbl{ font-size:11.5px; color:var(--ink-400); margin-bottom:4px; }
.ev-meta-grid .val{ font-size:13.8px; font-weight:600; color:var(--ink-900); }
.ev-section-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:24px 26px; margin-bottom:16px; }
.ev-section-card h4{ font-size:15.5px; margin:0 0 12px; color:var(--ink-900); }
.ev-section-card p{ font-size:13.8px; color:var(--ink-600); line-height:1.7; margin:0; }
.ev-learn-list{ list-style:none; margin:0; padding:0; }
.ev-learn-list li{ display:flex; align-items:flex-start; gap:9px; font-size:13.6px; color:var(--ink-700); margin-bottom:9px; }
.ev-learn-list li:last-child{ margin-bottom:0; }
.ev-learn-list li .dot{ width:6px; height:6px; border-radius:50%; background:var(--purple-600); margin-top:7px; flex-shrink:0; }
.ev-agenda-item{ display:flex; gap:20px; padding:10px 0; border-bottom:1px solid var(--line); font-size:13.6px; }
.ev-agenda-item:last-child{ border-bottom:none; }
.ev-agenda-item .t{ color:var(--purple-700); font-weight:700; width:70px; flex-shrink:0; }
.ev-agenda-item .i{ color:var(--ink-700); }
.ev-hostcard-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:14px; flex-wrap:wrap; }
.ev-hostcard-left{ display:flex; align-items:center; gap:12px; }
.ev-hostcard-left .ava{ width:42px; height:42px; border-radius:50%; color:#fff; font-weight:700; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ev-hostcard-left .hn{ font-size:14.5px; font-weight:700; color:var(--ink-900); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ev-hostcard-left .hr{ font-size:12.3px; color:var(--ink-400); }
.ev-viewprofile-btn{ background:#fff; border:1px solid var(--line); color:var(--purple-700); font-size:12.8px; font-weight:700; padding:8px 16px; border-radius:9px; cursor:pointer; flex-shrink:0; }
.ev-hostcard-bio{ font-size:13.3px; color:var(--ink-600); line-height:1.6; margin:0; }

.ev-side-datecard{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:22px; }
.ev-side-datecard .dt{ font-size:16px; font-weight:700; color:var(--ink-900); margin-bottom:4px; }
.ev-side-datecard .dm{ font-size:12.8px; color:var(--ink-600); margin-bottom:16px; }
.ev-attendees-row{ display:flex; align-items:center; gap:8px; margin-bottom:18px; }
.ev-attendee-stack{ display:flex; }
.ev-attendee-stack span{ width:26px; height:26px; border-radius:50%; border:2px solid #fff; margin-left:-8px; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.ev-attendee-stack span:first-child{ margin-left:0; }
.ev-attendees-row .n{ font-size:12.3px; color:var(--ink-600); }
.ev-share-link{ display:flex; align-items:center; justify-content:center; gap:6px; background:none; border:none; color:var(--purple-700); font-size:12.8px; font-weight:600; cursor:pointer; width:100%; margin-top:10px; }
.ev-freetext{ font-size:11.6px; color:var(--ink-400); text-align:center; margin-top:10px; line-height:1.5; }
.ev-related-item{ display:block; width:100%; text-align:left; background:none; border:none; padding:0; margin-bottom:14px; cursor:pointer; }
.ev-related-item:last-child{ margin-bottom:0; }
.ev-related-item .rt{ font-size:13px; font-weight:600; color:var(--ink-900); margin-bottom:2px; }
.ev-related-item .rs{ font-size:11.6px; color:var(--ink-400); }
.ev-related-item:hover .rt{ color:var(--purple-700); }

/* ---------- My Events ---------- */
.ev-tabs{ display:flex; gap:8px; margin-bottom:20px; }
.ev-tab{ background:#fff; border:1px solid var(--line); color:var(--ink-600); font-size:13px; font-weight:600; padding:8px 18px; border-radius:999px; cursor:pointer; }
.ev-tab.active{ background:var(--purple-700); border-color:var(--purple-700); color:#fff; }
.ev-my-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px 20px; display:flex; align-items:center; gap:18px; margin-bottom:14px; }
@media (max-width:700px){ .ev-my-card{ flex-wrap:wrap; } }
.ev-my-badges{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:7px; }
.ev-soon-pill{ background:#FEF3C7; color:#B45309; font-size:10.8px; font-weight:700; padding:3px 9px; border-radius:999px; }
.ev-registered-tag{ display:inline-flex; align-items:center; gap:4px; background:var(--mint-bg); color:var(--mint-text); font-size:10.8px; font-weight:700; padding:3px 9px; border-radius:999px; }
.ev-my-actions{ display:flex; flex-direction:column; gap:8px; align-items:flex-end; flex-shrink:0; }
.ev-join-btn{ background:var(--purple-700); color:#fff; border:none; border-radius:10px; padding:10px 18px; font-size:13px; font-weight:700; cursor:pointer; }
.ev-addcal-btn{ background:#fff; border:1px solid var(--line); color:var(--purple-700); border-radius:10px; padding:9px 16px; font-size:12.6px; font-weight:600; cursor:pointer; }
.ev-cancel-link{ background:none; border:none; color:var(--ink-400); font-size:12px; cursor:pointer; }
.ev-cancel-link:hover{ color:#DC2626; }
.ev-my-empty{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:50px 20px; text-align:center; color:var(--ink-400); font-size:13.5px; }
.ev-activity-row{ display:flex; align-items:center; gap:8px; margin-bottom:12px; font-size:13.3px; color:var(--ink-700); }
.ev-activity-row b{ font-size:16px; color:var(--ink-900); }
.ev-activity-num.green{ color:var(--mint-text); }
.ev-activity-num.amber{ color:#B45309; }

/* ---------- Past events grid ---------- */
.ev-rec-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
@media (max-width:960px){ .ev-rec-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:640px){ .ev-rec-grid{ grid-template-columns:1fr; } }
.ev-rec-card{ background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; cursor:pointer; transition:box-shadow .15s ease, transform .15s ease; }
.ev-rec-card:hover{ box-shadow:0 10px 24px rgba(17,17,20,.08); transform:translateY(-2px); }
.ev-rec-thumb{ position:relative; height:150px; display:flex; align-items:center; justify-content:center; }
.ev-rec-thumb .playc{ width:46px; height:46px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; }
.ev-rec-thumb .dur{ position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,.6); color:#fff; font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; }
.ev-rec-body{ padding:14px 16px; }
.ev-rec-pills{ display:flex; gap:6px; margin-bottom:9px; flex-wrap:wrap; }
.ev-watched-pill{ display:inline-flex; align-items:center; gap:4px; background:var(--mint-bg); color:var(--mint-text); font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
.ev-rec-body h3{ font-size:14.5px; margin:0 0 5px; color:var(--ink-900); }
.ev-rec-body .h{ font-size:12px; color:var(--ink-400); }

/* ---------- Recording player ---------- */
.rp-action-row{ display:flex; align-items:center; gap:20px; margin:16px 0 20px; flex-wrap:wrap; }
.rp-action-btn{ display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--ink-600); font-size:13px; font-weight:600; cursor:pointer; }
.rp-action-btn:hover{ color:var(--purple-700); }
.rp-action-btn.active{ color:var(--purple-700); }
.rp-chapters{ display:flex; flex-direction:column; }
.rp-chapter-item{ display:flex; align-items:center; gap:20px; padding:12px 10px; border-radius:9px; cursor:pointer; font-size:13.6px; background:none; border:none; text-align:left; width:100%; }
.rp-chapter-item:hover{ background:var(--bg); }
.rp-chapter-item .ct{ width:44px; flex-shrink:0; color:var(--ink-400); font-weight:600; font-size:12.8px; }
.rp-chapter-item .cl{ flex:1; color:var(--ink-700); }
.rp-chapter-item .np{ font-size:11.6px; color:var(--purple-700); font-weight:700; flex-shrink:0; }
.rp-chapter-item.current{ background:var(--purple-50); }
.rp-chapter-item.current .ct, .rp-chapter-item.current .cl{ color:var(--purple-800); font-weight:700; }
.rp-upnext-item{ display:flex; gap:10px; margin-bottom:14px; cursor:pointer; background:none; border:none; text-align:left; width:100%; padding:0; }
.rp-upnext-item:last-child{ margin-bottom:0; }
.rp-upnext-thumb{ width:64px; height:44px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; position:relative; }
.rp-upnext-thumb .p{ width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,.9); display:flex; align-items:center; justify-content:center; }
.rp-upnext-info .t{ font-size:12.8px; font-weight:600; color:var(--ink-900); margin-bottom:2px; }
.rp-upnext-info .s{ font-size:11.3px; color:var(--ink-400); }
.rp-upnext-item:hover .t{ color:var(--purple-700); }
.rp-resource-item{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.rp-resource-item:last-child{ margin-bottom:0; }
.rp-resource-icon{ width:34px; height:34px; border-radius:8px; background:#FEE2E2; color:#DC2626; font-size:9px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rp-resource-info{ flex:1; min-width:0; }
.rp-resource-info .n{ font-size:12.6px; font-weight:600; color:var(--ink-900); }
.rp-resource-info .s{ font-size:11px; color:var(--ink-400); }
.rp-resource-dl{ background:none; border:none; color:var(--ink-400); cursor:pointer; display:flex; flex-shrink:0; }
.rp-resource-dl:hover{ color:var(--purple-700); }

/* ---------- Register / calendar / cancel / share modals ---------- */
.reg-modal-icon{ width:52px; height:52px; border-radius:50%; background:var(--mint-bg); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
.reg-modal-title{ font-size:19px; font-weight:700; text-align:center; margin:0 0 8px; color:var(--ink-900); }
.reg-modal-sub{ font-size:13.3px; color:var(--ink-600); text-align:center; margin:0 0 20px; line-height:1.55; }
.reg-event-card{ background:var(--bg); border-radius:12px; padding:14px 16px; display:flex; gap:12px; align-items:center; margin-bottom:20px; }
.reg-event-card .db{ width:40px; text-align:center; background:#fff; border:1px solid var(--line); border-radius:8px; padding:5px 0; flex-shrink:0; }
.reg-event-card .db .m{ font-size:9px; font-weight:700; color:var(--purple-700); }
.reg-event-card .db .d{ font-size:15px; font-weight:700; color:var(--ink-900); }
.reg-event-card .t{ font-size:13px; font-weight:600; color:var(--ink-900); }
.reg-event-card .s{ font-size:11.8px; color:var(--ink-400); }
.reg-cal-label{ font-size:12.5px; color:var(--ink-600); margin-bottom:10px; }
.reg-cal-row{ display:flex; gap:10px; margin-bottom:6px; }
.reg-cal-btn{ flex:1; display:flex; align-items:center; justify-content:center; gap:7px; border:1px solid var(--line); background:#fff; border-radius:10px; padding:10px; font-size:12.6px; font-weight:600; color:var(--ink-700); cursor:pointer; }
.reg-cal-btn:hover{ background:var(--bg); }
.reg-done-link{ display:block; text-align:center; background:none; border:none; color:#6B7280; font-size:13px; margin-top:14px; cursor:pointer; width:100%; }

.cal-dropdown-label{ display:flex; align-items:center; justify-content:space-between; border:1px solid var(--purple-300); color:var(--purple-700); border-radius:10px; padding:10px 14px; font-weight:600; font-size:13.5px; margin-bottom:14px; }
.cal-option-list{ border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:14px; }
.cal-option{ display:flex; align-items:center; gap:12px; padding:13px 16px; font-size:13.5px; color:var(--ink-900); cursor:pointer; border-bottom:1px solid var(--line); background:#fff; width:100%; text-align:left; }
.cal-option:last-child{ border-bottom:none; }
.cal-option:hover{ background:var(--bg); }
.cal-option .icn{ width:22px; text-align:center; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.cal-hint{ font-size:11.8px; color:var(--ink-400); text-align:center; }

.cancel-modal-icon{ width:52px; height:52px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
.cancel-keep-btn{ width:100%; background:var(--purple-700); color:#fff; border:none; border-radius:10px; padding:12px; font-size:13.8px; font-weight:700; cursor:pointer; margin-bottom:10px; }
.cancel-keep-btn:hover{ background:var(--purple-800); }
.cancel-yes-link{ display:block; width:100%; text-align:center; background:none; border:none; color:#DC2626; font-size:13.5px; font-weight:600; cursor:pointer; }

.share-url-row{ display:flex; gap:8px; margin-bottom:16px; }
.share-url-row input{ flex:1; border:1px solid var(--line); border-radius:9px; padding:9px 12px; font-size:12.8px; color:var(--ink-600); background:var(--bg); }
.share-copy-btn{ background:var(--purple-700); color:#fff; border:none; border-radius:9px; padding:9px 16px; font-size:12.8px; font-weight:700; cursor:pointer; flex-shrink:0; }
.share-option-list{ border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:12px; }
.share-option{ display:flex; align-items:center; gap:12px; padding:12px 16px; font-size:13.5px; color:var(--ink-900); cursor:pointer; border-bottom:1px solid var(--line); background:#fff; text-decoration:none; width:100%; text-align:left; }
.share-option:last-child{ border-bottom:none; }
.share-option:hover{ background:var(--bg); }

/* ============================================================
   Shared generic controls for the ported sections
   ============================================================ */
.btn{ border-radius:10px; padding:10px 18px; font-size:13.5px; font-weight:600; cursor:pointer; border:none; display:inline-flex; align-items:center; gap:7px; white-space:nowrap; font-family:inherit; }
.btn-primary{ background:var(--purple-700); color:#fff; }
.btn-primary:hover{ background:var(--purple-800); }
.btn-outline{ background:#fff; color:var(--purple-700); border:1.4px solid var(--purple-600); }
.btn-outline:hover{ background:var(--purple-50); }
.btn-ghost-line{ background:#fff; color:var(--ink-600); border:1.4px solid var(--line); }
.btn-ghost-line:hover{ background:var(--bg); }
.btn-danger{ background:#fff; color:#DC2626; border:1.4px solid #FCA5A5; }
.btn-danger:hover{ background:#FEF2F2; }
.btn-sm{ padding:7px 13px; font-size:12.6px; }
.btn.block{ width:100%; justify-content:center; }
.link-btn{ background:none; border:none; color:var(--purple-600); font-weight:600; font-size:13px; cursor:pointer; padding:0; }
.link-btn:hover{ color:var(--purple-800); }

.field{ margin-bottom:14px; }
.field label{ display:block; font-size:12.5px; font-weight:600; color:#374151; margin-bottom:6px; }
.field input, .field select, .field textarea{ width:100%; border:1px solid var(--line); border-radius:10px; padding:9px 12px; font-size:13.5px; font-family:inherit; color:var(--ink-900); outline:none; background:#fff; }
.field input:focus, .field select:focus, .field textarea:focus{ border-color:var(--purple-600); }
.field textarea{ resize:vertical; min-height:78px; }
.field .hint{ font-size:11.5px; color:var(--ink-400); margin-top:5px; }
.field-row{ display:flex; gap:10px; }
.field-row .field{ flex:1; }

.sec-head-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:18px; flex-wrap:wrap; }
.sec-head-row h1{ font-size:23px; margin:0 0 6px; font-weight:700; color:var(--ink-900); }
.sec-head-row p{ margin:0; font-size:13.5px; color:var(--ink-600); }

.success-box{ text-align:center; padding:10px 0 4px; }
.success-icon{ width:46px; height:46px; border-radius:50%; background:var(--mint-bg); display:flex; align-items:center; justify-content:center; margin:0 auto 14px; }
.success-box h3{ font-size:16px; margin:0 0 8px; }
.success-box p{ font-size:13px; color:var(--ink-600); line-height:1.55; margin:0 0 18px; }

/* Side drawer (Contractor profile + Project detail) */
.sd-backdrop{ position:fixed; inset:0; background:rgba(17,17,20,.42); z-index:85; }
.sd-drawer{ position:fixed; top:0; right:0; height:100vh; width:600px; max-width:94vw; background:#fff; box-shadow:-16px 0 40px rgba(17,17,20,.18); z-index:86; display:flex; flex-direction:column; animation:sdIn .22s ease; }
@keyframes sdIn{ from{ transform:translateX(100%); } to{ transform:translateX(0); } }
.sd-topbar{ display:flex; align-items:center; justify-content:space-between; padding:16px 22px; border-bottom:1px solid var(--line); }
.sd-back{ display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--ink-600); font-size:13px; font-weight:600; cursor:pointer; }
.sd-back:hover{ color:var(--ink-900); }
.sd-scroll{ flex:1; overflow-y:auto; }
.sd-hero{ padding:22px; border-bottom:1px solid var(--line); }
.sd-section{ padding:20px 22px; border-bottom:1px solid var(--line); }
.sd-section h4{ font-size:13.5px; margin:0 0 12px; font-weight:700; color:var(--ink-900); }
.sd-section p{ font-size:13.3px; color:var(--ink-600); line-height:1.65; margin:0; }
.sd-footer{ padding:16px 22px; border-top:1px solid var(--line); display:flex; gap:10px; }
.sd-footer .btn{ flex:1; justify-content:center; }
.sd-close{ width:30px; height:30px; border-radius:50%; background:var(--bg); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }

/* ============================================================
   Contractors
   ============================================================ */
.cd-toolbar{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:12px; display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; position:relative; z-index:5; }
.cd-search-wrap{ position:relative; flex:1; min-width:220px; }
.cd-search-row{ display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--line); border-radius:10px; padding:9px 14px; }
.cd-search-row input{ border:none; background:none; outline:none; font-size:13.5px; flex:1; color:var(--ink-900); font-family:inherit; }
.cd-suggest{ position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 14px 30px rgba(17,17,20,.12); padding:6px; z-index:20; }
.cd-suggest-item{ display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; cursor:pointer; font-size:13px; }
.cd-suggest-item:hover{ background:var(--purple-50); }
.cd-suggest-item .s-ava{ width:26px; height:26px; border-radius:50%; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cd-suggest-item .s-role{ color:var(--ink-400); font-size:12px; }
.cd-suggest-empty{ padding:12px 10px; font-size:12.5px; color:var(--ink-400); }

.cd-filter{ position:relative; }
.cd-filter-btn{ background:#fff; border:1px solid var(--line); border-radius:10px; padding:9px 14px; font-size:13px; font-weight:500; color:var(--ink-900); display:flex; align-items:center; gap:8px; cursor:pointer; }
.cd-filter-btn.on{ border-color:var(--purple-600); color:var(--purple-700); background:var(--purple-50); }
.cd-filter-menu{ position:absolute; top:calc(100% + 6px); left:0; min-width:200px; background:#fff; border:1px solid var(--line); border-radius:12px; box-shadow:0 14px 30px rgba(17,17,20,.12); padding:6px; z-index:20; }
.cd-filter-option{ display:flex; align-items:center; justify-content:space-between; gap:8px; padding:9px 10px; border-radius:8px; cursor:pointer; font-size:13px; color:var(--ink-700); }
.cd-filter-option:hover{ background:var(--purple-50); }
.cd-filter-option.selected{ color:var(--purple-700); font-weight:600; }

.cd-results-row{ display:flex; align-items:center; gap:10px; margin-bottom:16px; font-size:13px; color:var(--ink-600); flex-wrap:wrap; }
.cd-results-row strong{ color:var(--ink-900); }

.cd-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media (max-width:1100px){ .cd-grid{ grid-template-columns:1fr 1fr; } }
@media (max-width:700px){ .cd-grid{ grid-template-columns:1fr; } }
.cd-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; display:flex; flex-direction:column; }
.cd-card-top{ display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
.cd-ava{ width:38px; height:38px; border-radius:50%; color:#fff; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cd-title-wrap{ flex:1; min-width:0; }
.cd-name-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cd-name{ font-size:14.5px; font-weight:600; margin:0; color:var(--ink-900); }
.cd-verified{ display:inline-flex; align-items:center; gap:4px; background:var(--mint-bg); color:var(--mint-text); font-size:11px; font-weight:600; padding:3px 8px; border-radius:999px; flex-shrink:0; }
.cd-role{ color:var(--purple-600); font-size:12.5px; font-weight:600; margin:2px 0 0; }
.cd-loc{ display:flex; align-items:center; gap:5px; color:var(--ink-400); font-size:12px; margin:8px 0 10px; }
.cd-desc{ font-size:13px; color:var(--ink-600); line-height:1.5; margin:0 0 12px; flex:1; }
.cd-tags{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.cd-tag{ background:var(--bg); color:var(--ink-600); font-size:11.5px; padding:4px 9px; border-radius:999px; }
.cd-actions{ display:flex; gap:8px; border-top:1px solid var(--line); padding-top:14px; }
.cd-actions .btn{ flex:1; justify-content:center; padding:9px 10px; font-size:12.8px; }
.cd-empty{ grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--ink-600); }
.cd-empty h3{ font-size:15px; margin:10px 0 6px; color:var(--ink-900); }
.cd-empty p{ margin:0 0 14px; font-size:13px; }

.cd-stars{ display:flex; gap:1px; }
.cd-drawer-meta{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; font-size:12.8px; color:var(--ink-600); margin-bottom:16px; }
.cd-drawer-meta span{ display:flex; align-items:center; gap:5px; }
.cd-meta-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; font-size:12.6px; color:var(--ink-600); }
.cd-meta-grid b{ color:var(--ink-900); display:block; font-size:12px; }
.cd-cert-list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
.cd-cert-list li{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-700); }
.cd-gallery{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.cd-gallery-tile{ aspect-ratio:1/1; border-radius:10px; background:linear-gradient(135deg,var(--purple-100),var(--bg)); display:flex; align-items:center; justify-content:center; }
.cd-review{ display:flex; gap:10px; margin-bottom:16px; }
.cd-review:last-child{ margin-bottom:0; }
.cd-rev-ava{ width:30px; height:30px; border-radius:50%; background:var(--purple-100); color:var(--purple-700); font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cd-rev-name{ font-size:12.8px; font-weight:600; }
.cd-review p{ font-size:12.8px; color:var(--ink-600); line-height:1.55; margin:3px 0 0; }
.cd-radio-row{ display:flex; gap:8px; }
.cd-radio-pill{ flex:1; border:1px solid var(--line); border-radius:10px; padding:9px; text-align:center; font-size:12.8px; cursor:pointer; color:var(--ink-600); background:#fff; }
.cd-radio-pill.selected{ border-color:var(--purple-600); background:var(--purple-50); color:var(--purple-700); font-weight:600; }

/* ============================================================
   Community
   ============================================================ */
.cm-feed{ display:flex; flex-direction:column; gap:14px; }
.cm-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px; }
.cm-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:14px; }
.cm-user{ display:flex; align-items:center; gap:10px; }
.cm-ava{ width:36px; height:36px; border-radius:50%; color:#fff; font-weight:700; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cm-user .name{ font-size:13.5px; font-weight:600; color:var(--ink-900); }
.cm-user .name span{ color:var(--ink-400); font-weight:400; }
.cm-user .role{ font-size:12px; color:var(--ink-400); }
.cm-tag{ background:var(--purple-100); color:var(--purple-700); font-size:11.5px; font-weight:600; padding:4px 11px; border-radius:999px; flex-shrink:0; }
.cm-title{ font-size:15px; font-weight:700; margin:0 0 8px; color:var(--ink-900); }
.cm-body{ font-size:13.3px; color:var(--ink-600); line-height:1.6; margin:0 0 14px; }
.cm-foot{ display:flex; align-items:center; gap:18px; font-size:12.5px; color:var(--ink-400); flex-wrap:wrap; }
.cm-foot span{ display:flex; align-items:center; gap:5px; }
.cm-foot a{ margin-left:auto; color:var(--purple-600); font-weight:600; display:flex; align-items:center; gap:4px; cursor:pointer; }
.cm-topic-row{ display:flex; align-items:center; justify-content:space-between; font-size:13px; margin-bottom:10px; }
.cm-topic-row:last-child{ margin-bottom:0; }
.cm-topic-row a{ color:var(--purple-600); font-weight:600; cursor:pointer; }
.cm-topic-row span{ color:var(--ink-400); font-size:12px; }
.cm-member-row{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.cm-member-row:last-child{ margin-bottom:0; }
.cm-member-info{ flex:1; min-width:0; }
.cm-member-info .name{ font-size:13px; font-weight:600; color:var(--ink-900); }
.cm-member-info .role{ font-size:11.5px; color:var(--ink-400); }
.cm-guide-list{ list-style:none; margin:0 0 4px; padding:0; display:flex; flex-direction:column; gap:16px; }
.cm-guide-list li{ display:flex; gap:12px; }
.cm-guide-num{ width:26px; height:26px; border-radius:8px; background:var(--purple-100); color:var(--purple-700); font-size:12.5px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.cm-guide-list h5{ font-size:13.5px; margin:0 0 4px; font-weight:600; color:var(--ink-900); }
.cm-guide-list p{ font-size:12.8px; color:var(--ink-600); line-height:1.55; margin:0; }

/* ============================================================
   Due Diligence Vault
   ============================================================ */
.vt-proj-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:18px; flex-wrap:wrap; }
.vt-proj-row1{ display:flex; align-items:center; gap:10px; margin-bottom:4px; flex-wrap:wrap; }
.vt-proj-row1 h3{ font-size:15px; margin:0; font-weight:700; color:var(--ink-900); }
.vt-chip{ background:var(--purple-100); color:var(--purple-700); font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:999px; }
.vt-proj-row2{ font-size:12.6px; color:var(--ink-600); }
.vt-proj-right{ text-align:right; min-width:220px; }
.vt-proj-num{ font-size:13.5px; color:var(--ink-600); margin-bottom:8px; }
.vt-proj-num b{ font-size:15px; color:var(--ink-900); }
.vt-bar{ width:220px; max-width:100%; height:7px; background:var(--line); border-radius:999px; overflow:hidden; display:inline-block; }
.vt-bar > span{ display:block; height:100%; background:#10B981; border-radius:999px; }
.vt-bar.thin{ height:6px; width:100%; margin-bottom:16px; }
.vt-bar.thin:last-child{ margin-bottom:0; }
.vt-stack{ display:flex; flex-direction:column; gap:14px; }
.vt-section{ background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; }
.vt-section-head{ display:flex; align-items:center; gap:10px; padding:18px 22px; border-bottom:1px solid var(--line); color:var(--ink-900); }
.vt-section-head h3{ font-size:14.5px; margin:0; font-weight:700; }
.vt-section-head .count{ color:var(--ink-400); font-size:12.5px; font-weight:500; }
.vt-doc-row{ display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:1px solid var(--line); }
.vt-doc-row:last-child{ border-bottom:none; }
.vt-doc-icon{ width:38px; height:38px; border-radius:9px; color:#fff; font-size:10px; font-weight:800; letter-spacing:.02em; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.vt-doc-info{ flex:1; min-width:0; }
.vt-doc-info .dname{ font-size:13.6px; font-weight:600; margin-bottom:2px; color:var(--ink-900); }
.vt-doc-info .dmeta{ font-size:12px; color:var(--ink-400); }
.vt-status{ display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; padding:5px 11px; border-radius:999px; flex-shrink:0; }
.vt-status .dot{ width:6px; height:6px; border-radius:50%; }
.vt-status.verified{ background:var(--mint-bg); color:var(--mint-text); }
.vt-status.verified .dot{ background:#10B981; }
.vt-status.pending{ background:#FFFBEB; color:#B45309; }
.vt-status.pending .dot{ background:#F59E0B; }
.vt-doc-actions{ display:flex; align-items:center; gap:16px; flex-shrink:0; }
@media (max-width:600px){ .vt-doc-row{ flex-wrap:wrap; } .vt-doc-actions{ margin-left:52px; } }
.vt-status-line{ display:flex; align-items:center; gap:8px; font-size:12.8px; margin-bottom:6px; }
.vt-status-line .dot{ width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.vt-status-line b{ margin-left:auto; font-weight:700; }
.vt-access{ background:var(--purple-50); border:1px solid var(--purple-100); }
.vt-access h4{ color:var(--purple-900); }
.vt-access p{ font-size:12.6px; color:var(--ink-600); line-height:1.6; margin:0; }
.vt-recent{ margin-bottom:14px; }
.vt-recent:last-child{ margin-bottom:0; }
.vt-recent .rname{ font-size:13px; font-weight:600; margin-bottom:2px; color:var(--ink-900); }
.vt-recent .rmeta{ font-size:11.6px; color:var(--ink-400); }
.vt-dropzone{ border:1.6px dashed var(--line); border-radius:12px; padding:26px 16px; text-align:center; cursor:pointer; background:var(--bg); }
.vt-dropzone:hover{ border-color:var(--purple-600); background:var(--purple-50); }
.vt-dz-icon{ width:36px; height:36px; border-radius:10px; background:transparent; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
.vt-dz-title{ font-size:13px; font-weight:600; margin-bottom:3px; }
.vt-dz-hint{ font-size:11.6px; color:var(--ink-400); }
.vt-chosen{ display:flex; align-items:center; gap:10px; margin-top:10px; background:var(--bg); border-radius:10px; padding:9px 12px; font-size:12.6px; color:var(--ink-700); }
.vt-prev-head{ display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.vt-prev-head .pname{ font-size:15.5px; font-weight:700; margin-bottom:3px; color:var(--ink-900); }
.vt-prev-head .pmeta{ font-size:12px; color:var(--ink-400); }
.vt-prev-frame{ background:var(--bg); border:1px solid var(--line); border-radius:12px; padding:22px; margin-bottom:16px; }
.vt-page-mock{ background:#fff; border:1px solid var(--line); border-radius:8px; padding:18px 20px; box-shadow:0 6px 16px rgba(17,17,20,.06); max-width:280px; margin:0 auto; }
.vt-pl{ height:8px; background:#EDEDEF; border-radius:3px; margin-bottom:8px; }
.vt-pl.w60{ width:60%; } .vt-pl.w80{ width:80%; } .vt-pl.w40{ width:40%; }
.vt-pl.title{ height:11px; width:70%; background:#DDD6FE; margin-bottom:14px; }
.vt-page-caption{ text-align:center; font-size:12px; color:var(--ink-400); margin-top:12px; }
.vt-zip{ text-align:center; padding:10px 0; }
.vt-zip-icon{ width:48px; height:48px; border-radius:12px; background:#FFFBEB; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
.vt-zip p{ font-size:12.8px; color:var(--ink-600); margin:0 auto; line-height:1.55; max-width:280px; }
.vt-status-note{ font-size:12.6px; color:var(--ink-600); background:var(--bg); border-radius:10px; padding:10px 14px; margin-bottom:18px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.vt-prev-actions{ display:flex; gap:10px; }
.vt-prev-actions .btn{ flex:1; justify-content:center; }

/* ============================================================
   Project Pipeline
   ============================================================ */
.pp-stats{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px 26px; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }
@media (max-width:1080px){ .pp-stats{ grid-template-columns:1fr 1fr; } }
.pp-stat{ border-right:1px solid var(--line); }
.pp-stat:last-child{ border-right:none; }
@media (max-width:1080px){ .pp-stat:nth-child(2){ border-right:none; } }
.pp-stat .val{ font-size:22px; font-weight:700; margin-bottom:3px; color:var(--ink-900); }
.pp-stat .lbl{ font-size:12.5px; color:var(--ink-600); }
.pp-board{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; align-items:start; }
@media (max-width:1080px){ .pp-board{ grid-template-columns:1fr 1fr; } }
@media (max-width:640px){ .pp-board{ grid-template-columns:1fr; } }
.pp-col{ background:#F0F0F2; border-radius:14px; padding:14px; }
.pp-col-head{ display:flex; align-items:center; gap:9px; margin-bottom:12px; padding:0 2px; }
.pp-col-bar{ width:3px; height:16px; border-radius:2px; }
.pp-col-head h3{ font-size:13.5px; margin:0; font-weight:700; flex:1; color:var(--ink-900); }
.pp-col-count{ background:#E4E4E7; color:var(--ink-600); font-size:11.5px; font-weight:700; padding:2px 8px; border-radius:999px; }
.pp-col-cards{ display:flex; flex-direction:column; gap:10px; }
.pp-card{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:15px; cursor:pointer; transition:box-shadow .12s ease, transform .12s ease; }
.pp-card:hover{ box-shadow:0 8px 18px rgba(17,17,20,.08); transform:translateY(-1px); }
.pp-tagrow{ display:flex; align-items:center; gap:8px; margin-bottom:9px; }
.pp-type-tag{ font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; }
.pp-live{ display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--mint-text); }
.pp-live .dot{ width:6px; height:6px; border-radius:50%; background:#10B981; }
.pp-name{ font-size:13.8px; font-weight:600; margin:0 0 6px; color:var(--ink-900); }
.pp-loc{ display:flex; align-items:center; gap:5px; color:var(--ink-400); font-size:12px; margin-bottom:10px; }
.pp-cap{ font-size:13px; margin-bottom:12px; }
.pp-cap b{ color:var(--purple-700); font-weight:700; }
.pp-cap span{ color:var(--ink-400); margin-left:3px; }
.pp-contractor{ display:flex; align-items:center; gap:8px; border-top:1px solid var(--line); padding-top:11px; }
.pp-contractor .ava{ width:22px; height:22px; border-radius:50%; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.pp-contractor span.n{ font-size:12.5px; color:var(--ink-600); font-weight:500; }
.pp-cap-big{ font-size:24px; font-weight:700; color:var(--purple-700); margin-top:10px; }
.pp-cap-big span{ font-size:13px; color:var(--ink-400); font-weight:500; margin-left:5px; }
.pp-stepper{ display:flex; align-items:flex-start; padding:20px 22px; border-bottom:1px solid var(--line); }
.pp-step{ flex:1; text-align:center; position:relative; }
.pp-sdot{ width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid var(--line); display:flex; align-items:center; justify-content:center; margin:0 auto 8px; font-size:10px; color:var(--ink-400); font-weight:700; position:relative; z-index:1; }
.pp-step.done .pp-sdot{ background:var(--purple-700); border-color:var(--purple-700); color:#fff; }
.pp-step.current .pp-sdot{ border-color:var(--purple-700); color:var(--purple-700); box-shadow:0 0 0 3px var(--purple-100); }
.pp-slabel{ font-size:11px; color:var(--ink-400); font-weight:600; }
.pp-step.done .pp-slabel, .pp-step.current .pp-slabel{ color:var(--purple-700); }
.pp-sline{ position:absolute; top:11px; left:-50%; width:100%; height:2px; background:var(--line); }
.pp-step.done .pp-sline{ background:var(--purple-700); }
.pp-step:first-child .pp-sline{ display:none; }
.pp-meta-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.pp-mi b{ display:block; font-size:13px; margin:6px 0 2px; color:var(--ink-900); }
.pp-mi span{ font-size:11.6px; color:var(--ink-400); }
.pp-contractor-row{ display:flex; align-items:center; gap:10px; }
.pp-contractor-row .cname{ font-size:13.5px; font-weight:600; color:var(--ink-900); }
.pp-contractor-row .crole{ font-size:12px; color:var(--ink-400); }
.pp-vault-link{ display:flex; align-items:center; gap:8px; color:var(--purple-600); font-weight:600; font-size:13px; cursor:pointer; background:none; border:none; padding:0; }
.pp-timeline{ list-style:none; margin:0; padding:0; }
.pp-timeline li{ display:flex; gap:12px; padding-bottom:16px; position:relative; }
.pp-timeline li:last-child{ padding-bottom:0; }
.pp-timeline li::before{ content:''; position:absolute; left:5px; top:14px; bottom:0; width:1.5px; background:var(--line); }
.pp-timeline li:last-child::before{ display:none; }
.pp-tdot{ width:11px; height:11px; border-radius:50%; background:var(--purple-700); flex-shrink:0; margin-top:2px; }
.pp-ttext{ font-size:13px; font-weight:600; color:var(--ink-900); }
.pp-twhen{ font-size:11.6px; color:var(--ink-400); }

/* ============================================================
   Settings
   ============================================================ */
.st-layout{ display:flex; gap:20px; align-items:flex-start; }
.st-nav{ width:220px; flex-shrink:0; background:#fff; border:1px solid var(--line); border-radius:14px; padding:10px; }
.st-nav-item{ display:block; width:100%; text-align:left; background:none; border:none; padding:10px 12px; border-radius:9px; font-size:13.8px; font-weight:500; color:var(--ink-600); cursor:pointer; margin-bottom:2px; }
.st-nav-item:last-child{ margin-bottom:0; }
.st-nav-item:hover{ background:var(--bg); }
.st-nav-item.active{ background:var(--purple-100); color:var(--purple-700); font-weight:700; }
.st-panels{ flex:1; min-width:0; }
@media (max-width:900px){ .st-layout{ flex-direction:column; } .st-nav{ width:100%; display:flex; gap:6px; overflow-x:auto; padding:8px; } .st-nav-item{ white-space:nowrap; width:auto; margin-bottom:0; } }
.st-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:24px 28px; margin-bottom:18px; }
.st-card h2{ font-size:16px; margin:0 0 18px; font-weight:700; color:var(--ink-900); }
.st-card h2 .hint{ font-size:12px; color:var(--ink-400); font-weight:500; margin-left:8px; }
.st-grid{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }
@media (max-width:700px){ .st-grid{ grid-template-columns:1fr; } }
.st-field label{ display:block; font-size:12.8px; color:var(--ink-600); margin-bottom:7px; font-weight:500; }
.st-field input, .st-field select{ width:100%; border:1px solid var(--line); border-radius:10px; padding:10px 13px; font-size:13.8px; font-family:inherit; color:var(--ink-900); outline:none; background:#fff; }
.st-field input:focus, .st-field select:focus{ border-color:var(--purple-600); }
.st-row{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 0; border-bottom:1px solid var(--line); }
.st-row:first-child{ padding-top:0; }
.st-row:last-child{ border-bottom:none; padding-bottom:0; }
.st-row .stitle{ font-size:13.8px; font-weight:600; margin-bottom:3px; color:var(--ink-900); }
.st-row .sdesc{ font-size:12.5px; color:var(--ink-600); }
.st-toggle{ position:relative; width:42px; height:24px; flex-shrink:0; }
.st-toggle input{ position:absolute; opacity:0; width:100%; height:100%; margin:0; cursor:pointer; z-index:1; }
.st-track{ position:absolute; inset:0; background:#E4E4E7; border-radius:999px; transition:background .15s ease; }
.st-track::after{ content:''; position:absolute; top:3px; left:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:transform .15s ease; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.st-toggle input:checked ~ .st-track{ background:var(--purple-700); }
.st-toggle input:checked ~ .st-track::after{ transform:translateX(18px); }
.st-rpills{ display:flex; gap:10px; }
@media (max-width:600px){ .st-rpills{ flex-direction:column; } }
.st-rpill{ border:1px solid var(--line); border-radius:10px; padding:12px 16px; flex:1; text-align:center; cursor:pointer; font-size:13.3px; font-weight:500; color:var(--ink-600); background:#fff; }
.st-rpill.selected{ border-color:var(--purple-600); background:var(--purple-50); color:var(--purple-700); font-weight:700; }
.st-rpill .t{ display:block; margin-bottom:2px; }
.st-rpill .s{ display:block; font-size:11px; font-weight:400; color:var(--ink-400); }
.st-rpill.selected .s{ color:var(--purple-600); }
.st-chips{ display:flex; gap:9px; flex-wrap:wrap; }
.st-chip{ display:inline-flex; align-items:center; gap:6px; padding:9px 15px; border-radius:999px; border:1px solid var(--line); font-size:13px; font-weight:500; color:var(--ink-600); cursor:pointer; background:#fff; }
.st-chip.selected{ background:var(--purple-700); border-color:var(--purple-700); color:#fff; }
.st-sub{ font-size:12.8px; color:var(--ink-600); margin-bottom:10px; font-weight:500; }
.st-session{ display:flex; align-items:center; gap:14px; padding:15px 0; border-bottom:1px solid var(--line); }
.st-session:first-of-type{ padding-top:0; }
.st-session:last-child{ border-bottom:none; padding-bottom:0; }
.st-session-icon{ width:38px; height:38px; border-radius:10px; background:transparent; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.st-session-info{ flex:1; min-width:0; }
.st-session-info .sname{ font-size:13.6px; font-weight:600; color:var(--ink-900); }
.st-session-info .smeta{ font-size:12px; color:var(--ink-400); }
.st-current{ font-size:11px; font-weight:600; color:var(--mint-text); background:var(--mint-bg); padding:4px 10px; border-radius:999px; flex-shrink:0; }
.st-logout{ color:#DC2626; font-weight:600; font-size:12.8px; background:none; border:none; cursor:pointer; flex-shrink:0; }
.st-connect{ display:flex; align-items:center; gap:14px; padding:17px 0; border-bottom:1px solid var(--line); }
.st-connect:first-of-type{ padding-top:0; }
.st-connect:last-child{ border-bottom:none; padding-bottom:0; }
.st-connect-icon{ width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; flex-shrink:0; }
.st-connect-info{ flex:1; min-width:0; }
.st-connect-info .cname{ font-size:13.8px; font-weight:600; margin-bottom:2px; color:var(--ink-900); }
.st-connect-info .cdesc{ font-size:12.3px; color:var(--ink-400); }
.st-connected-badge{ font-size:11.5px; font-weight:600; color:var(--mint-text); background:var(--mint-bg); padding:4px 11px; border-radius:999px; margin-right:12px; }
.st-danger{ background:#FEF2F2; border-color:#FCA5A5; }
.st-danger h2{ color:#B91C1C; }
.st-danger p{ font-size:12.8px; color:#991B1B; margin:0 0 16px; line-height:1.55; }
.st-footer-bar{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }

/* ---- Community/Contractors/Vault/Pipeline/Settings styles (scoped) ---- */
.tcx{--p9:#2E1065;--p8:#3B0764;--p7:#5B21B6;--p6:#7C3AED;--p1:#F3E8FF;--p0:#FAF5FF;--i9:#1F2937;--i6:#4B5563;--i4:#9CA3AF;--ln:#E7E7EA;--bg:#F7F7F8;--mint:#ECFDF5;--mt:#047857;--am:#FFFBEB;--at:#B45309}
.tcx *{box-sizing:border-box}
.tcx button{font-family:inherit}
.tcx h1,.tcx h2,.tcx h3,.tcx h4,.tcx p{margin:0}
.tcx .ava{border-radius:50%;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tcx .ph{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px;flex-wrap:wrap}
.tcx .ph h1{font-size:23px;margin-bottom:6px}
.tcx .ph p{font-size:13.5px;color:var(--i6)}
.tcx .btn{border-radius:10px;padding:10px 18px;font-size:13.5px;font-weight:600;cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}
.tcx .bp{background:var(--p7);color:#fff}
.tcx .bp:hover{background:var(--p8)}
.tcx .bo{background:#fff;color:var(--p7);border:1.4px solid var(--p6)}
.tcx .bo:hover{background:var(--p0)}
.tcx .bl{background:#fff;color:var(--i6);border:1.4px solid var(--ln)}
.tcx .bd{background:#fff;color:#DC2626;border:1.4px solid #FCA5A5}
.tcx .sm{padding:7px 13px;font-size:12.6px}
.tcx .blk{width:100%}
.tcx .lk{background:none;border:0;color:var(--p6);font-weight:600;font-size:13px;cursor:pointer;padding:0}
.tcx .card{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:18px}
.tcx .tool{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:12px;display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.tcx .tool input,.tcx .tool select,.tcx .fld input,.tcx .fld select,.tcx .fld textarea{border:1px solid var(--ln);border-radius:10px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;background:#fff;color:var(--i9)}
.tcx .tool input{flex:1;min-width:200px;background:var(--bg)}
.tcx .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.tcx .tag{background:var(--bg);color:var(--i6);font-size:11.5px;padding:4px 9px;border-radius:999px}
.tcx .tp{background:var(--p1);color:var(--p7);font-size:11.5px;font-weight:600;padding:4px 11px;border-radius:999px}
.tcx .ver{background:var(--mint);color:var(--mt);font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;white-space:nowrap}
.tcx .pen{background:var(--am);color:var(--at);font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;white-space:nowrap}
.tcx .mut{font-size:12px;color:var(--i4)}
.tcx .sub{font-size:13px;color:var(--i6);line-height:1.55}
.tcx .row{display:flex;align-items:center;gap:10px}
.tcx .wrap{flex-wrap:wrap}
.tcx .sp{flex:1;min-width:0}
.tcx .ov{position:fixed;inset:0;background:rgba(17,17,20,.42);display:flex;align-items:center;justify-content:center;padding:20px;z-index:80}
.tcx .bk{position:fixed;inset:0;background:rgba(17,17,20,.42);z-index:85}
.tcx .md{width:100%;background:#fff;border-radius:20px;padding:28px;position:relative;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(17,17,20,.25)}
.tcx .md h2{font-size:18px;margin-bottom:4px;padding-right:24px}
.tcx .md-sub-divider{border-bottom:1px solid var(--ln);margin:16px -28px 20px;padding:0}
.tcx .x{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#94A3B8;border:0;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;line-height:1}
.tcx .x:hover{background:#7C8CA3}
.tcx .x.s{position:static}
.tcx .fld{margin-bottom:14px}
.tcx .fld label{display:block;font-size:12.5px;font-weight:600;margin-bottom:6px;color:#374151}
.tcx .fld input,.tcx .fld select,.tcx .fld textarea{width:100%}
.tcx .fld textarea{min-height:80px;resize:vertical}
.tcx .md-footer{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--ln);margin:20px -28px -28px;padding:18px 28px}
.tcx .ok{text-align:center;padding:36px 6px 10px;min-height:220px;display:flex;flex-direction:column;justify-content:center}
.tcx .ok h3{font-size:19px;margin-bottom:8px}
.tcx .ok .sub{margin-bottom:22px}
.tcx .dr{position:fixed;top:0;right:0;height:100vh;width:600px;max-width:100vw;background:#fff;z-index:90;display:flex;flex-direction:column;box-shadow:-16px 0 40px rgba(17,17,20,.18);animation:sl .22s ease}
@keyframes sl{from{transform:translateX(100%)}}
.tcx .dt{display:flex;justify-content:space-between;align-items:center;padding:16px 22px;border-bottom:1px solid var(--ln)}
.tcx .ds{flex:1;overflow-y:auto}
.tcx .sec{padding:20px 22px;border-bottom:1px solid var(--ln)}
.tcx .sec h4{font-size:13.5px;margin-bottom:10px}
.tcx .df{padding:16px 22px;border-top:1px solid var(--ln);display:flex;gap:10px}
.tcx .df .btn{flex:1}
.tcx .lay{display:flex;gap:20px;align-items:flex-start}
.tcx .rail{width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:14px}
.tcx .pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.tcx .pl{background:#fff;border:1px solid var(--ln);color:var(--i6);font-size:13px;font-weight:500;padding:8px 16px;border-radius:999px;cursor:pointer}
.tcx .pl.on{background:var(--p7);border-color:var(--p7);color:#fff}
.tcx .board{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}
.tcx .col{background:#F0F0F2;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}
.tcx .pc{background:#fff;border:1px solid var(--ln);border-radius:12px;padding:15px;cursor:pointer}
.tcx .pc:hover{box-shadow:0 8px 18px rgba(17,17,20,.08)}
.tcx .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
.tcx .stats b{font-size:22px;display:block}
.tcx .step{display:flex;padding:20px 22px;border-bottom:1px solid var(--ln)}
.tcx .step div{flex:1;text-align:center;font-size:11px;font-weight:600;color:var(--i4)}
.tcx .step i{display:block;width:22px;height:22px;border-radius:50%;border:2px solid var(--ln);margin:0 auto 6px;font-style:normal;font-size:10px;line-height:18px}
.tcx .step .d,.tcx .step .c{color:var(--p7)}
.tcx .step .d i{background:var(--p7);border-color:var(--p7);color:#fff}
.tcx .step .c i{border-color:var(--p7)}
.tcx .sn{width:220px;flex-shrink:0;background:#fff;border:1px solid var(--ln);border-radius:14px;padding:10px}
.tcx .sn button{display:block;width:100%;text-align:left;background:none;border:0;padding:10px 12px;border-radius:9px;font-size:13.8px;font-weight:500;color:var(--i6);cursor:pointer}
.tcx .sn .on{background:var(--p1);color:var(--p7);font-weight:700}
.tcx .g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.tcx .set{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--ln)}
.tcx .set:last-child{border:0}
.tcx .tg{position:relative;width:42px;height:24px;flex-shrink:0}
.tcx .tg input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}
.tcx .tg span{position:absolute;inset:0;background:#E4E4E7;border-radius:999px;transition:.15s}
.tcx .tg span:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.15s}
.tcx .tg input:checked+span{background:var(--p7)}
.tcx .tg input:checked+span:after{transform:translateX(18px)}
.tcx .rp{border:1px solid var(--ln);border-radius:10px;padding:12px;flex:1;text-align:center;cursor:pointer;font-size:13.3px;color:var(--i6);background:#fff}
.tcx .rp.on{border-color:var(--p6);background:var(--p0);color:var(--p7);font-weight:700}
.tcx .ch{padding:9px 15px;border-radius:999px;border:1px solid var(--ln);font-size:13px;cursor:pointer;background:#fff;color:var(--i6)}
.tcx .ch.on{background:var(--p7);border-color:var(--p7);color:#fff}
.tcx .ic2{width:38px;height:38px;border-radius:9px;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tcx .bar{height:7px;background:var(--ln);border-radius:999px;overflow:hidden}
.tcx .bar span{display:block;height:100%;background:#10B981}
.tcx .dr2{padding:16px 22px;border-bottom:1px solid var(--ln)}

/* ================= Merged platform: shared tokens, shell, spacing ================= */
.tca,.tcx{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:var(--ink-900)}
.tca button:focus-visible,.tca a:focus-visible,.tca [tabindex]:focus-visible{outline:2px solid var(--purple-600);outline-offset:2px}
.tcx input:focus,.tcx select:focus,.tcx textarea:focus{border-color:var(--p6)!important;box-shadow:0 0 0 3px var(--p1)}
@media (prefers-reduced-motion:reduce){.tca *{animation:none!important;transition:none!important}}
.tca-btn-primary{background:var(--purple-700)}.tca-btn-primary:hover{background:var(--purple-800)}
.tca-btn-primary.disabled,.tca-btn-primary.disabled:hover{background:var(--purple-100)}

/* shell */
.dash-sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;height:100dvh;overflow-y:auto;z-index:60}
.dash-main{width:calc(100% - 260px);margin-left:260px;min-width:0}
.dash-sidebar.collapsed+.dash-main{width:calc(100% - 76px);margin-left:76px}
.dash-brand-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 6px 22px}
.dash-brand{background:none;border:0;text-align:left;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:9px;padding:0;font-weight:700;font-size:15px;color:var(--ink-900);min-width:0}
.dash-brand .word{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-navitem{font-family:inherit;padding:10px 12px;margin-bottom:4px;gap:14px;color:#475467}
.dash-navgroup{margin-bottom:24px}
.dash-topbar{padding:11px 40px;min-height:63px;justify-content:flex-start;position:sticky;top:0;z-index:56}
.dash-searchbar{margin:0}.dash-searchbar input{flex:1;min-width:0;border:0;background:none;outline:none;font:inherit;color:var(--ink-900)}
.dash-topbar-right{margin-left:auto}
.dash-user{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;cursor:pointer;font-family:inherit}
.dash-user .dash-avatar{width:34px;height:34px;font-size:14px}
.dash-user-name{font-size:14px;font-weight:500;color:var(--ink-900)}
@media (max-width:640px){.dash-user-name{display:none}}
.dash-collapse-btn{display:flex;background:none;border:0;padding:7px;color:var(--ink-600);cursor:pointer;border-radius:8px;flex-shrink:0}
.dash-collapse-btn:hover{background:var(--bg);color:var(--ink-900)}
.dash-scrim{position:fixed;inset:0;background:rgba(17,17,20,.42);z-index:65}
.dash-content{padding:40px 40px 80px;max-width:1240px}

/* ---- Collapsible desktop sidebar (icon rail), hamburger lives beside the logo ---- */
.dash-sidebar{transition:width .18s ease}
/* Hide the native scrollbar in the left sidebar (it still scrolls with wheel/touch on short screens) */
.dash-sidebar{scrollbar-width:none;-ms-overflow-style:none}
.dash-sidebar::-webkit-scrollbar{display:none;width:0;height:0}
.dash-sidebar.collapsed{width:76px}
.dash-sidebar.collapsed .dash-brand-row{justify-content:center}
.dash-sidebar.collapsed .dash-brand{justify-content:center}
.dash-sidebar.collapsed .dash-brand .word,
.dash-sidebar.collapsed .dash-navitem .lbl,
.dash-sidebar.collapsed .dash-navlabel{display:none}
.dash-sidebar.collapsed .dash-navitem{justify-content:center;padding:10px}
.dash-sidebar.collapsed .dash-navgroup{margin-bottom:14px}
.dash-sidebar.collapsed .dash-brand-row{flex-direction:column;gap:12px;padding-bottom:22px}

@media (max-width:1023px){
  .dash-sidebar{position:fixed;left:0;top:0;bottom:0;width:72px;height:100dvh;overflow-y:auto;flex-shrink:0;transition:width .2s ease}
  .dash-main{width:calc(100% - 72px);margin-left:72px}
  .dash-sidebar.collapsed+.dash-main{width:calc(100% - 72px);margin-left:72px}
  .dash-sidebar .dash-brand-row{justify-content:center;flex-direction:column;gap:12px}
  .dash-sidebar .dash-brand{justify-content:center}
  .dash-sidebar .dash-brand .word,.dash-sidebar .dash-navitem .lbl,.dash-sidebar .dash-navlabel{display:none}
  .dash-sidebar .dash-navitem{justify-content:center;padding:10px}
  .dash-sidebar.open{position:fixed;left:0;top:0;bottom:0;z-index:75;width:230px;box-shadow:8px 0 30px rgba(0,0,0,.15)}
  .dash-sidebar.open .dash-brand-row{justify-content:space-between;flex-direction:row;padding:0 6px 22px}
  .dash-sidebar.open .dash-brand{justify-content:flex-start}
  .dash-sidebar.open .dash-brand .word,.dash-sidebar.open .dash-navitem .lbl,.dash-sidebar.open .dash-navlabel{display:inline}
  .dash-sidebar.open .dash-navitem{justify-content:flex-start;padding:10px 12px}
  .dash-topbar,.dash-content{padding-left:24px;padding-right:24px}
}
@media (max-width:640px){.dash-topbar{padding:12px 16px}.dash-content{padding:28px 18px 64px}.dash-topbar-right{gap:12px}}


/* ---- Notifications dropdown ---- */
.dash-notif-wrap{position:relative}
.dash-bell-btn{display:grid;place-items:center;width:48px;height:48px;padding:0;margin:-2px;border:0;border-radius:10px;background:transparent;color:#6B7280;cursor:pointer;transition:background .15s ease,color .15s ease}
.dash-bell-btn:hover{background:var(--bg)}
.dash-notif-panel{position:fixed;top:calc(75px + env(safe-area-inset-top));right:16px;left:auto;width:min(360px,calc(100vw - 32px));max-height:calc(100dvh - 88px);background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(17,17,20,.18);border:1px solid var(--line);z-index:95;overflow:hidden}
.dash-notif-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#fff,#fbfaff)}
.dash-notif-heading{display:grid;gap:4px}
.dash-notif-head h4{margin:0;font-size:15px;font-weight:750;color:var(--ink-900)}
.dash-notif-unread-count{color:var(--ink-400);font-size:11px;line-height:1.3}
.dash-notif-mark{background:none;border:0;color:var(--purple-600);font-size:12.5px;font-weight:600;cursor:pointer;padding:0}
.dash-notif-list{max-height:360px;overflow-y:auto}
.dash-notif-empty{display:grid;min-height:180px;place-items:center;padding:22px 18px;margin:0;color:var(--ink-400);font-size:12.5px;line-height:1.5;text-align:center}
.dash-notif-error-card{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px;padding:12px 14px;border:1px solid #E5E7EB;border-left:3px solid #98A2B3;border-radius:10px;background:#fff;color:#344054}
.dash-notif-error-card strong{display:block;margin-bottom:3px;font-size:12px}
.dash-notif-error-card p{margin:0;color:#667085;font-size:11px;line-height:1.45}
.dash-notif-error-card button{flex:0 0 auto;border:1px solid #D0D5DD;border-radius:999px;background:#fff;padding:6px 11px;color:#475467;font:inherit;font-size:11px;font-weight:700;cursor:pointer}
.dash-notif-error-card button:disabled{cursor:wait;opacity:.6}
.dash-notif-item{position:relative;display:flex;align-items:flex-start;gap:12px;width:100%;padding:14px 16px;border:0;border-left:3px solid transparent;border-bottom:1px solid #f0edf5;background:#fff;text-align:left;cursor:pointer;transition:background .14s ease,border-color .14s ease}
.dash-notif-item:hover{background:#f9f6ff}
.dash-notif-item:last-child{border-bottom:0}
.dash-notif-item.unread{border-left-color:var(--purple-600);background:#faf7ff}
.dash-notif-item .ic{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:44px;height:44px;border:1px solid #e5d6f5;border-radius:12px;background:#f2eafb;color:var(--purple-700)}
.dash-notif-item .ic svg{width:22px;height:22px}
.dash-notif-item .sp{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
.dash-notif-title{display:block;color:var(--ink-900);font-size:13px;font-weight:700;line-height:1.45}
.dash-notif-meta{display:block;color:var(--ink-400);font-size:11px;line-height:1.4}
.dash-notif-dot{width:8px;height:8px;border-radius:50%;background:var(--purple-600);flex-shrink:0;margin-top:7px;box-shadow:0 0 0 3px #eee5f8}
.dash-notif-foot{padding:12px 18px;text-align:center;border-top:1px solid var(--line)}
.dash-notif-foot button{background:none;border:0;color:var(--purple-600);font-size:12.8px;font-weight:600;cursor:pointer}
.dash-notif-foot button:disabled{color:var(--ink-400);cursor:default}
@media (max-width:480px){.dash-notif-panel{position:fixed;top:65px;right:8px;left:8px;width:auto}}

/* readable spacing on the original screens */
.dash-page-head h1,.tcx .ph h1{font-size:26px;line-height:1.25;margin:0 0 8px}
.dash-page-head p,.tcx .ph p{font-size:14.5px;line-height:1.65;max-width:640px;margin:0}
.dash-page-head{margin-bottom:32px}
.dash-banner{padding:40px;margin-bottom:40px}.dash-banner p{line-height:1.7;margin-bottom:22px}
.dash-section-sub{margin-bottom:24px;line-height:1.6}
.dash-stats-grid,.dash-cards-grid,.dash-notsure-grid{gap:20px}.dash-stats-grid{margin-bottom:32px}
.dash-stat-card{padding:22px}.dash-action-card{padding:26px}.dash-action-card p{font-size:13.5px;line-height:1.65;margin-bottom:16px}
.dash-action-card h3{margin-bottom:8px}.dash-action-card .chip{margin-bottom:16px}
.dash-notsure{padding:32px;margin-top:40px}.dash-notsure>p{margin-bottom:24px}.dash-mini-card{padding:20px}
.dash-mini-card .a{line-height:1.6;margin-bottom:10px}
.dash-action-card button,.dash-mini-card button.l{background:none;border:0;padding:0;font-family:inherit;font-size:13px;font-weight:600;color:var(--purple-600);cursor:pointer;display:inline-flex;align-items:center;gap:4px;text-align:left}
.dash-footer-tag{margin-top:48px}
.learn-grid{gap:24px}.learn-card-body{padding:22px}.learn-card-body p{font-size:13.5px;line-height:1.65}
.learn-continue-banner{padding:30px 32px;margin-bottom:32px}.learn-filters{margin-bottom:28px}
.course-layout{gap:32px}.course-sidebar{gap:20px}.ev-list{gap:20px}.ev-card{padding:22px 24px}
.ev-nextup-banner{padding:30px 32px;margin-bottom:32px}
@media (max-width:640px){.dash-banner,.ev-nextup-banner,.learn-continue-banner{padding:26px 22px}.dash-notsure{padding:24px 20px}}

/* Community / Contractors / Vault / Pipeline / Settings / Messaging */
.tcx .bp{background:var(--purple-700)}.tcx .btn{padding:11px 20px;font-size:14px}.tcx .btn.sm{padding:8px 14px;font-size:13px}
.tcx .sub{font-size:14px;line-height:1.65}.tcx .mut{font-size:12.5px;line-height:1.5}
.tcx .card{padding:26px;border-radius:14px}
.tcx .tool{padding:16px;gap:12px;margin-bottom:24px}.tcx .tool input,.tcx .tool select{padding:11px 14px;font-size:14px}
.tcx .g3{grid-template-columns:repeat(3,1fr);gap:24px}.tcx .g2{gap:24px}
.tcx .lay{gap:32px}.tcx .rail{width:320px;gap:24px}.tcx .pills{gap:10px;margin-bottom:28px}.tcx .pl{padding:9px 18px;font-size:13.5px}
.tcx .stats{gap:24px;margin-bottom:28px;padding:26px}.tcx .stats b{font-size:26px;margin-bottom:4px}
.tcx .board{grid-template-columns:repeat(4,1fr);gap:20px}.tcx .col{padding:18px;gap:14px}.tcx .pc{padding:18px}
.tcx .sec{padding:26px 28px}.tcx .sec h4{font-size:14px;margin-bottom:12px}.tcx .dt{padding:18px 28px}.tcx .df{padding:18px 28px}
.tcx .step{padding:24px 28px}.tcx .md{padding:32px;max-width:100%}.tcx .md h2{font-size:18px;margin-bottom:6px}
.tcx .md-sub-divider{margin:18px -32px 22px}.tcx .md-footer{margin:22px -32px -32px;padding:18px 32px}
@media (max-width:640px){.tcx .md{padding:26px 22px}.tcx .md-sub-divider{margin:16px -22px 18px}.tcx .md-footer{margin:18px -22px -22px;padding:14px 22px;flex-wrap:wrap}.tcx .md-footer .btn{flex:1}}
.tcx .fld{margin-bottom:20px}.tcx .fld label{font-size:13.5px;margin-bottom:8px}.tcx .fld input,.tcx .fld select,.tcx .fld textarea{padding:11px 14px;font-size:14px}
.tcx .set{padding:20px 0;gap:20px}.tcx .rp{padding:14px}.tcx .ch{padding:10px 16px}.tcx .sn{width:230px;padding:12px}.tcx .sn button{padding:12px 14px;font-size:14px}
.tcx .row{gap:12px}.tcx h3{line-height:1.35}
.tcx .msg{display:grid;grid-template-columns:330px 1fr;background:#fff;border:1px solid var(--ln);border-radius:14px;height:calc(100vh - 180px);min-height:520px;overflow:hidden}
.tcx .ml{border-right:1px solid var(--ln);overflow-y:auto;display:flex;flex-direction:column;min-height:0}
.tcx .ml-head{padding:20px 20px 14px;border-bottom:1px solid var(--ln);flex-shrink:0}
.tcx .ml-head h2{font-size:20px;margin-bottom:14px}
.tcx .ml-search{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:10px;padding:9px 12px}
.tcx .ml-search input{flex:1;min-width:0;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--i9)}
.tcx .ml-list{overflow-y:auto;flex:1}
.tcx .mt2{display:flex;flex-direction:column;min-width:0}
.tcx .mi{display:flex;gap:12px;align-items:center;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--ln);padding:16px 20px;cursor:pointer;font-family:inherit}
.tcx .mi:hover{background:#FAFAFA}.tcx .mi.on{background:var(--p0)}
.tcx .mi-time{font-size:11.5px;color:var(--i4);flex-shrink:0;white-space:nowrap}
.tcx .mi-preview{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;max-width:210px}
.tcx .mi-dot{width:8px;height:8px;border-radius:50%;background:var(--p6);flex-shrink:0}
.tcx .mh{display:flex;gap:12px;align-items:center;padding:16px 24px;border-bottom:1px solid var(--ln)}
.tcx .status-dot{width:7px;height:7px;border-radius:50%;background:#9CA3AF;display:inline-block}
.tcx .status-dot.on{background:#10B981}
.tcx .mb{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:14px;background:var(--bg)}
.tcx .mb-date{display:flex;justify-content:center;margin-bottom:4px}
.tcx .mb-date span{background:#EEEEF1;color:var(--i4);font-size:11.5px;font-weight:600;padding:5px 14px;border-radius:999px}
.tcx .bub{max-width:min(520px,82%);padding:12px 16px;border-radius:14px;font-size:14px;line-height:1.6;background:#fff;border:1px solid var(--ln);align-self:flex-start}
.tcx .bub.me{align-self:flex-end;background:var(--p7);border-color:var(--p7);color:#fff}
.tcx .bub small{display:block;margin-top:4px;font-size:11px;opacity:.65}
.tcx .mf{display:flex;gap:12px;padding:16px 20px;border-top:1px solid var(--ln)}.tcx .mf input{flex:1;min-width:0;border:1px solid var(--ln);border-radius:999px;padding:11px 18px;font:inherit;font-size:14px;outline:none}
.tcx .mback{display:none}
@media (max-width:1240px){.tcx .lay:not(.st){flex-direction:column}.tcx .lay:not(.st) .rail{width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.tcx .board{grid-template-columns:1fr 1fr}.tcx .g3{grid-template-columns:1fr 1fr}}
@media (max-width:900px){.tcx .lay.st{flex-direction:column}.tcx .sn{width:100%;display:flex;gap:6px;overflow-x:auto}.tcx .sn button{white-space:nowrap;width:auto}.tcx .g2,.tcx .stats{grid-template-columns:1fr 1fr}
  .tcx .msg{grid-template-columns:1fr;height:calc(100vh - 160px)}.tcx .msg.thread .ml,.tcx .msg:not(.thread) .mt2{display:none}.tcx .mback{display:inline-flex}
  .tcx .mh{padding:14px 16px;gap:10px;flex-wrap:nowrap}.tcx .mh .sp{min-width:0;overflow:hidden}.tcx .mh .sp b,.tcx .mh .sp .mut{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
  .tcx .mh .btn{flex-shrink:0;padding:8px 12px;font-size:12.5px}}
@media (max-width:640px){.tcx .g3,.tcx .board,.tcx .g2,.tcx .stats{grid-template-columns:1fr}.tcx .ph .btn,.tcx .ph .row{width:100%}.tcx .md{padding:26px 22px}.tcx .card{padding:22px}.tcx .sec,.tcx .dt,.tcx .df{padding-left:20px;padding-right:20px}.tcx .set{flex-wrap:wrap}.tcx .row.doc{flex-wrap:wrap}.tcx .df{flex-wrap:wrap}.tcx .mi-preview{max-width:140px}}


/* ---------- Discussion detail (Community) ---------- */
.tcx .disc-title-btn{background:none;border:0;padding:0;text-align:left;cursor:pointer;font-family:inherit;color:inherit;display:block;width:100%}
.tcx .disc-title-btn h3{transition:color .12s ease}
.tcx .disc-title-btn:hover h3{color:var(--p7)}
.tcx .dd{--dd-purple:#6700A6;--dd-tint:#F4EAFB;--dd-ink:#111827;--dd-body:#4B5563;--dd-mut:#6B7280;--dd-line:#ECECF0;--dd-mint:#F5FCF9;--dd-mint-line:#BFE8D6;--dd-green:#0E9F6E;--dd-pill:#E7F7F1}
.tcx .dd button:focus-visible,.tcx .dd input:focus-visible{outline:2px solid var(--dd-purple);outline-offset:2px}
.tcx .dd-back{display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:0;margin-bottom:22px;font-family:inherit;font-size:13.5px;font-weight:600;line-height:1;color:var(--dd-purple);cursor:pointer}
.tcx .dd-lay{display:flex;gap:20px;align-items:flex-start}
.tcx .dd-main{flex:1;min-width:0}
.tcx .dd-rail{width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:18px}
.tcx .dd-card{background:#fff;border:1px solid var(--dd-line);border-radius:16px;box-shadow:0 1px 2px rgba(17,17,20,.04)}
.tcx .dd-post{padding:24px}
.tcx .dd-head{display:flex;align-items:flex-start;gap:12px}
.tcx .dd-who{flex:1;min-width:0}
.tcx .dd-name{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;font-weight:600;line-height:1.35;color:var(--dd-ink)}
.tcx .dd-meta{font-size:12px;line-height:1.5;color:var(--dd-mut)}
.tcx .dd-tag{background:var(--dd-tint);color:var(--dd-purple);font-size:11.5px;font-weight:600;padding:4px 12px;border-radius:999px;white-space:nowrap}
.tcx .dd-title{font-size:22px;font-weight:700;line-height:1.3;letter-spacing:-.01em;color:var(--dd-ink);margin:18px 0 12px}
.tcx .dd-body{font-size:14.5px;line-height:1.55;color:var(--dd-body);margin:0 0 12px}
.tcx .dd-actions{display:flex;flex-wrap:wrap;align-items:center;gap:14px 26px;border-top:1px solid #EEEEF1;margin-top:18px;padding-top:16px}
.tcx .dd-act{display:inline-flex;align-items:center;gap:7px;background:none;border:0;padding:0;font-family:inherit;font-size:13.5px;color:var(--dd-mut)}
.tcx button.dd-act{cursor:pointer}
.tcx button.dd-act:hover{color:var(--dd-ink)}
.tcx .dd-act.on{color:var(--dd-purple)}
.tcx .dd-composer{display:flex;align-items:center;gap:14px;padding:16px 20px;margin:18px 0 24px}
.tcx .dd-input{flex:1;min-width:0;height:40px;border:0;border-radius:8px;background:#F2F2F5;padding:0 16px;font-family:inherit;font-size:13.5px;color:var(--dd-ink);outline:none}
.tcx .dd-input::placeholder{color:#9CA3AF}
.tcx .dd-input:focus{box-shadow:0 0 0 2px #D9B8EE}
.tcx .dd-send{height:40px;padding:0 20px;border:0;border-radius:8px;background:var(--dd-purple);color:#fff;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap}
.tcx .dd-rhead{display:flex;align-items:baseline;gap:6px;margin:0 0 14px}
.tcx .dd-rhead b{font-size:16px;font-weight:600;color:var(--dd-ink)}
.tcx .dd-rhead span{font-size:13px;color:var(--dd-mut)}
.tcx .dd-reply{padding:18px 20px;margin-bottom:16px}
.tcx .dd-reply.best{background:var(--dd-mint);border-color:var(--dd-mint-line)}
.tcx .dd-reply-body{font-size:14px;line-height:1.6;color:var(--dd-body);margin:14px 0 12px}
.tcx .dd-reply-foot{display:flex;align-items:center;gap:20px}
.tcx .dd-like{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:0;font-family:inherit;font-size:13px;color:var(--dd-mut);cursor:pointer}
.tcx .dd-like.on{color:var(--dd-purple)}
.tcx .dd-link{background:none;border:0;padding:0;font-family:inherit;font-size:13px;font-weight:600;color:var(--dd-purple);cursor:pointer}
.tcx .dd-pill{display:inline-flex;align-items:center;gap:5px;background:var(--dd-pill);color:var(--dd-green);font-size:11px;font-weight:600;line-height:1;padding:5px 10px;border-radius:999px;white-space:nowrap}
.tcx .dd-pill.badge{font-size:11.5px;padding:6px 12px;margin-left:auto}
.tcx .dd-side{padding:20px 22px}
.tcx .dd-side h4{font-size:15px;font-weight:600;color:var(--dd-ink);margin:0 0 16px}
.tcx .dd-fact{display:flex;align-items:baseline;gap:6px;font-size:13px;margin-bottom:12px}
.tcx .dd-fact:last-child{margin-bottom:0}
.tcx .dd-fact span{color:var(--dd-mut)}
.tcx .dd-fact b{font-weight:600;color:var(--dd-ink)}
.tcx .dd-rel{display:block;width:100%;text-align:left;background:none;border:0;padding:0;margin-bottom:16px;cursor:pointer;font-family:inherit}
.tcx .dd-rel:last-child{margin-bottom:0}
.tcx .dd-rel b{display:block;font-size:13.5px;font-weight:600;line-height:1.4;color:var(--dd-ink)}
.tcx .dd-rel:hover b{color:var(--dd-purple)}
.tcx .dd-rel span{display:block;font-size:11.5px;color:var(--dd-mut);margin-top:2px}
.tcx .dd-tip{background:#FAF5FF;border-color:#EBDDF6;box-shadow:none}
.tcx .dd-tip h4{color:var(--dd-purple);font-size:14px;margin-bottom:10px}
.tcx .dd-tip p{margin:0;font-size:12.5px;line-height:1.6;color:var(--dd-mut)}
@media (max-width:1024px){.tcx .dd-lay{flex-direction:column}.tcx .dd-main,.tcx .dd-rail{width:100%}}
@media (max-width:640px){.tcx .dd-post{padding:20px}.tcx .dd-title{font-size:19px}.tcx .dd-composer{flex-wrap:wrap}.tcx .dd-input{flex-basis:100%;order:2}.tcx .dd-send{width:100%;order:3}.tcx .dd-actions{gap:12px 20px}}

/* ---------- List your business (matches design "default") ---------- */
.lb-ov{position:fixed;right:0;bottom:0;z-index:80;display:flex;justify-content:flex-end;align-items:flex-start;padding:27px 32px 24px;background:rgba(17,17,20,.34);box-sizing:border-box}
.lb-ov.list-business-overlay{inset:0;justify-content:center;align-items:center;padding:24px;background:rgba(17,17,20,.38);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.lb-ov.list-business-overlay .lb-modal{max-height:calc(100dvh - 48px)}
.lb-modal{--lb-purple:#6700A6;--lb-line:#E5E5E5;--lb-field:#B5B5B5;--lb-ink:#1A1A1A;--lb-mut:#6B7280;
  position:relative;display:flex;flex-direction:column;width:558px;max-width:100%;max-height:100%;background:#fff;border:1px solid var(--lb-line);border-radius:8px;box-shadow:0 12px 32px rgba(17,17,20,.14);box-sizing:border-box;color:var(--lb-ink);font-family:inherit}
.lb-modal *{box-sizing:border-box}
.lb-close{position:absolute;top:21px;right:21px;width:24px;height:24px;border-radius:50%;background:#94A3B8;border:0;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.lb-close:hover{background:#7C8CA3}
.lb-head{padding:55px 21px 9px;border-bottom:1px solid var(--lb-line);flex-shrink:0}
.lb-head h2{margin:0;font-size:15px;line-height:20px;font-weight:600;color:#111;padding:0}
.lb-head p{margin:4px 0 0;font-size:13.5px;line-height:20px;color:var(--lb-mut)}
.lb-body{padding:24px 21px 11px;overflow-y:auto;flex:1;min-height:0}
.lb-field{margin-bottom:16px;position:relative}
.lb-label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px;font-size:12.5px;line-height:15px;font-weight:400;color:var(--lb-ink)}
.lb-label em{font-style:normal;font-size:12.5px;color:var(--lb-mut)}
.lb-control{display:flex;align-items:center;width:100%;height:48px;padding:0 12px;border:1px solid var(--lb-field);border-radius:6px;background:#fff;font-family:inherit;font-size:14px;color:var(--lb-ink);outline:none;text-align:left;transition:border-color .12s ease,box-shadow .12s ease}
.lb-control::placeholder{color:#B0B3B8;opacity:1}
.lb-control:focus,.lb-control.open{border-color:var(--lb-purple);box-shadow:0 0 0 3px rgba(103,0,166,.12)}
.lb-control.err{border-color:#DC2626}
textarea.lb-control{display:block;height:96px;padding:12px;resize:none;line-height:1.5}
button.lb-control{cursor:pointer;justify-content:space-between;gap:10px}
.lb-val{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-val.empty{color:#B0B3B8}
.lb-chev{color:#A3A3A8;flex-shrink:0;margin-right:0;transition:transform .15s ease}
.lb-control.open .lb-chev{transform:rotate(180deg)}
.lb-msg{margin-top:5px;font-size:12px;color:#DC2626}
.lb-menu{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5;margin:0;padding:6px;list-style:none;background:#fff;border:1px solid var(--lb-line);border-radius:8px;box-shadow:0 12px 28px rgba(17,17,20,.16)}
.lb-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:6px;background:none;font-family:inherit;font-size:13.5px;color:var(--lb-ink);text-align:left;cursor:pointer}
.lb-opt:hover{background:#F7F7F8}
.lb-opt.on{color:var(--lb-purple);font-weight:600}
.lb-foot{display:flex;justify-content:flex-end;gap:20px;padding:21px;border-top:1px solid var(--lb-line);flex-shrink:0}
.lb-btn{height:40px;padding:0 20px;border-radius:6px;font-family:inherit;font-size:14px;line-height:1;cursor:pointer;white-space:nowrap}
.lb-cancel{background:#fff;border:1px solid #C9C9CC;color:var(--lb-mut);min-width:86px}
.lb-cancel:hover{background:#F7F7F8}
.lb-submit{background:var(--lb-purple);border:1px solid var(--lb-purple);color:#fff;font-weight:500;min-width:160px}
.lb-submit:hover{background:#560088}
.lb-modal button:focus-visible{outline:2px solid var(--lb-purple);outline-offset:2px}
.lb-done{padding:64px 32px 28px;text-align:center}
.lb-done .ic{width:52px;height:52px;border-radius:50%;background:#ECFDF5;color:#047857;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.lb-done h3{margin:0 0 6px;font-size:18px;font-weight:600;color:#111}
.lb-done p{margin:0 0 24px;font-size:13.5px;line-height:1.6;color:var(--lb-mut)}
.lb-done .lb-submit{width:100%}
/* Contact contractor modal (design "Contractors › Contact") */
.lb-method{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.lb-method-btn{height:48px;padding:0 12px;border:1px solid var(--lb-field);border-radius:6px;background:#fff;font-family:inherit;font-size:14px;line-height:1;color:#B0B3B8;cursor:pointer;transition:border-color .15s ease,color .15s ease,background .15s ease}
.lb-method-btn:hover{border-color:#8F8F95;color:#6B7280}
.lb-method-btn.on{border-color:var(--lb-purple);background:#F6EEFB;color:var(--lb-purple);font-weight:500}
.lb-ov.ct-ov{padding-top:28px}
.lb-ov.ct-ov.center{padding-top:24px}
.lb-modal.ct .lb-head{padding-top:54px}
.lb-modal.ct .lb-head h2{font-weight:500}
.lb-modal.ct textarea.lb-control{height:97px}
.lb-modal.ct .lb-submit{min-width:161px}
.lb-modal.ct-sent .lb-submit{min-width:0}
.lb-modal.ct-sent .lb-done p{margin-bottom:24px}
.lb-modal.ct-sent .lb-cancel.wide{width:100%;height:40px;margin-bottom:12px}
/* Community › Ask a question (matches design) */
.lb-modal.ask .lb-head{padding-top:54px}
.lb-modal.ask .lb-head h2{font-weight:500}
.lb-modal.ask textarea.lb-control{height:97px}
.lb-modal.ask .lb-submit{min-width:133px}
.lb-modal.ask .lb-cancel{min-width:87px}
.lb-modal.disc .lb-submit{min-width:149px}
.lb-modal.disc .lb-label label{cursor:pointer}
/* Project Pipeline › project details */
.lb-modal.pj .lb-submit{min-width:0;padding:0 18px}
.lb-modal.pj .lb-cancel{min-width:0;padding:0 18px;color:var(--lb-purple);border-color:#D9C2EC}
.lb-modal.pj .lb-cancel:hover{background:#F6EEFB}
.pj-sec{padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid var(--lb-line)}
.pj-top{display:flex;gap:40px;flex-wrap:wrap}
.pj-k{display:block;font-size:12.5px;color:var(--lb-mut);margin-bottom:5px}
.pj-cap{font-size:24px;line-height:1.1;font-weight:700;color:var(--lb-purple)}
.pj-stage{font-size:15px;font-weight:600;display:block;padding-top:6px}
.pj-h{font-size:12.5px;line-height:15px;color:var(--lb-ink);font-weight:600;margin-bottom:12px}
.pj-step{display:flex}
.pj-step div{flex:1;text-align:center;font-size:11.5px;font-weight:600;color:#9CA3AF;min-width:0}
.pj-step i{display:block;width:24px;height:24px;border-radius:50%;border:2px solid #E5E5E5;margin:0 auto 7px;font-style:normal;font-size:11px;line-height:20px}
.pj-step .d,.pj-step .c{color:var(--lb-purple)}
.pj-step .d i{background:var(--lb-purple);border-color:var(--lb-purple);color:#fff}
.pj-step .c i{border-color:var(--lb-purple)}
.pj-row{display:flex;align-items:center;gap:12px}
.pj-row b{display:block;font-size:14px;color:var(--lb-ink)}
.pj-row span{display:block;font-size:12.5px;color:var(--lb-mut);margin-top:2px}
.pj-act{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--lb-ink);margin-bottom:10px}
.pj-act:last-child{margin-bottom:0}
.pj-act i{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.pj-link{background:none;border:0;padding:0 0 13px;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--lb-purple);cursor:pointer;text-align:left}
.pj-link:hover{text-decoration:underline}
.pj-done{flex:1;align-self:center;font-size:13px;color:var(--lb-mut)}
@media (max-width:640px){.pj-top{gap:28px}.pj-done{flex-basis:100%}.lb-modal.pj .lb-foot{flex-wrap:wrap}}
/* Host profile */
.ev-host-link{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;font-weight:inherit}
.ev-host-link:hover{color:var(--purple-700);text-decoration:underline}
.lb-modal.hp .hp-head{display:flex;align-items:center;gap:14px;padding:44px 21px 18px}
.hp-ava{width:52px;height:52px;border-radius:50%;color:#fff;font-weight:700;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hp-id h2{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hp-id p{margin:2px 0 0}
.hp-h{margin:0 0 8px;font-size:12.5px;font-weight:600;color:#111}
.hp-bio{margin:0 0 18px;font-size:13.5px;line-height:1.6;color:var(--lb-mut)}
.hp-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}
.hp-stats>div{border:1px solid var(--lb-line);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.hp-stats b{font-size:18px;font-weight:600;color:#111}
.hp-stats span{font-size:12.5px;color:var(--lb-mut)}
.hp-empty{margin:0;font-size:13px;color:var(--lb-mut)}
.hp-event.here{cursor:default;background:#FAF5FD;border-color:#E6D3F3}
.hp-viewing{font-size:11px;font-weight:600;color:var(--lb-purple);background:#F3E8FA;border-radius:999px;padding:3px 10px;flex-shrink:0}
.hp-event{width:100%;display:flex;align-items:center;gap:12px;padding:10px 12px;margin-bottom:8px;background:#fff;border:1px solid var(--lb-line);border-radius:8px;cursor:pointer;text-align:left;font-family:inherit}
.hp-event:hover{border-color:var(--lb-purple);background:#FAF5FD}
.hp-date{width:44px;height:44px;border-radius:8px;background:#F3E8FA;color:var(--lb-purple);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;font-weight:700;line-height:1.1;flex-shrink:0}
.hp-date b{font-size:16px}
.hp-einfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.hp-einfo .t{font-size:13.5px;font-weight:600;color:#111}
.hp-einfo .s{font-size:12px;color:var(--lb-mut)}
.lb-modal.hp .hp-follow{min-width:140px}
.lb-modal.hp .hp-follow.following{background:#fff;color:var(--lb-purple)}
/* Edit profile modal (reuses the .lb- shell; same look as "Upload document") */
.lb-modal.pe .lb-body{padding:24px 21px 27px}
.lb-modal.pe .lb-field{margin-bottom:24px}
.lb-modal.pe .lb-field:last-child{margin-bottom:0}
.lb-chips{display:flex;flex-wrap:wrap;gap:9px}
.lb-chip{height:40px;padding:0 14px;border:1px solid var(--lb-field);border-radius:6px;background:#fff;font-family:inherit;font-size:14px;line-height:1;color:#6B7280;cursor:pointer;transition:border-color .15s ease,color .15s ease,background .15s ease}
.lb-chip:hover{border-color:#8F8F95}
.lb-chip.on{border-color:var(--lb-purple);background:#F6EEFB;color:var(--lb-purple);font-weight:500}
/* Upload document modal (reuses the .lb- shell; matches design "Upload document") */
.lb-modal.up .lb-body{padding:24px 21px 27px}
.lb-modal.up .lb-field{margin-bottom:24px}
.lb-modal.up .lb-field:last-child{margin-bottom:0}
.lb-modal.up .lb-foot{padding:21px}
.lb-modal.up .lb-submit{min-width:192px}
.lb-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:100%;height:157px;padding:16px;border:1px dashed #A3A3A8;border-radius:8px;background:#fff;text-align:center;cursor:pointer;font-family:inherit;transition:border-color .12s ease,background .12s ease}
.lb-drop:hover,.lb-drop.over{border-color:var(--lb-purple);background:#FAF5FF}
.lb-drop.err{border-color:#DC2626}
.lb-drop svg{color:#1F2937;margin-bottom:12px}
.lb-drop .l1{font-size:13.5px;line-height:20px;color:#8A8A93}
.lb-drop .l1 b{font-weight:400;color:var(--lb-purple)}
.lb-drop .l2{margin-top:9px;font-size:11.5px;line-height:16px;color:#A3A3A8}
.lb-drop .fname{max-width:100%;font-size:13.5px;line-height:20px;font-weight:500;color:var(--lb-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-drop .fsub{margin-top:4px;font-size:11.5px;line-height:16px;color:var(--lb-mut)}
/* Upload success state (design "success") */
.lb-ov.center{inset:0;align-items:center;justify-content:center;padding:24px;background:rgba(17,17,20,.34);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.lb-modal.ok{width:412px;padding:21px}
.lb-modal.ok .lb-close{top:22px;right:22px}
.lb-modal.ok .lb-done{padding:0;text-align:center}
.lb-modal.ok .lb-done .sp{height:165px}
.lb-modal.ok .lb-done h3{margin:0;font-size:16px;line-height:20px;font-weight:500;color:#111}
.lb-modal.ok .lb-done p{margin:4px 0 40px;font-size:13.5px;line-height:20px;color:var(--lb-mut)}
.lb-modal.ok .lb-submit{width:100%;min-width:0;height:40px}

/* Due Diligence Vault page (matches design) */
.tcx .vt-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.tcx .vt-head h1{margin:0 0 6px;font-size:24px;line-height:30px;font-weight:600;color:var(--i9)}
.tcx .vt-head p{margin:0;font-size:14px;line-height:20px;color:var(--i6);max-width:none}
.tcx .vt-up{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 20px;border:0;border-radius:6px;background:#6700A6;color:#fff;font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;white-space:nowrap}
.tcx .vt-up:hover{background:#560088}
.tcx .vt-card{background:#fff;border:1px solid var(--ln);border-radius:12px;overflow:hidden}
.tcx .vt-proj{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;padding:16px 20px;margin-bottom:20px}
.tcx .vt-proj h3{margin:0;font-size:17px;line-height:24px;font-weight:600;color:var(--i9)}
.tcx .vt-pill{background:#DBEAFE;color:#1D4ED8;font-size:10.5px;font-weight:500;padding:2px 8px;border-radius:999px;white-space:nowrap}
.tcx .vt-proj p{margin:2px 0 0;font-size:12px;line-height:18px;color:#8A8A93}
.tcx .vt-prog{width:220px;max-width:100%;text-align:right}
.tcx .vt-prog p{margin:0 0 6px;font-size:12px;color:#8A8A93}
.tcx .vt-prog p b{font-size:18px;font-weight:600;color:#059669;margin-right:4px}
.tcx .vt-bar{height:6px;background:#E7E7EA;border-radius:999px;overflow:hidden}
.tcx .vt-bar span{display:block;height:100%;border-radius:999px}
.tcx .vt-lay{display:flex;gap:20px;align-items:flex-start}
.tcx .vt-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:20px}
.tcx .vt-rail{width:300px;flex-shrink:0;display:flex;flex-direction:column;gap:20px}
.tcx .vt-sec-h{display:flex;align-items:center;gap:12px;padding:0 18px;height:51px;background:#F5F5F7;border-bottom:1px solid var(--ln)}
.tcx .vt-sec-h svg{color:#8A8A93;flex-shrink:0}
.tcx .vt-sec-h h3{margin:0;font-size:14px;font-weight:500;color:var(--i9)}
.tcx .vt-sec-h span{font-size:12px;color:#A3A3A8}
.tcx .vt-doc{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 18px;border-bottom:1px solid #EFEFF1;background:#fff}
.tcx .vt-doc:last-child{border-bottom:0}
.tcx .vt-ic{width:38px;height:38px;border-radius:8px;color:#fff;font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:.2px}
.tcx .vt-doc-t{flex:1;min-width:150px}
.tcx .vt-doc-t b{display:block;font-size:13.5px;line-height:18px;font-weight:500;color:var(--i9)}
.tcx .vt-doc-t span{display:block;font-size:11.5px;line-height:16px;color:#8A8A93}
.tcx .vt-st{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;padding:3px 9px;border-radius:999px;white-space:nowrap}
.tcx .vt-st::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor}
.tcx .vt-st.is-ok{background:#ECFDF5;color:#047857}
.tcx .vt-st.is-pen{background:#FEF3C7;color:#B45309}
.tcx .vt-acts{display:flex;gap:16px;margin-left:8px}
.tcx .vt-acts button{background:none;border:0;padding:0;font-family:inherit;font-size:12px;font-weight:500;color:#6700A6;cursor:pointer}
.tcx .vt-acts button:hover{text-decoration:underline}
.tcx .vt-side{padding:18px}
.tcx .vt-side h4{margin:0 0 14px;font-size:15px;line-height:20px;font-weight:600;color:var(--i9)}
.tcx .vt-stat{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;line-height:18px;color:#6B7280}
.tcx .vt-stat i{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.tcx .vt-stat b{font-weight:600;color:var(--i9)}
.tcx .vt-stat+.vt-bar{margin-bottom:16px;height:5px}
.tcx .vt-acc{background:#F3EFF8;border-color:#E6DDF0;padding:18px}
.tcx .vt-acc h4{margin:0 0 10px;font-size:13.5px;font-weight:500;color:#6700A6}
.tcx .vt-acc p{margin:0;font-size:12px;line-height:17px;color:#8A8A93}
.tcx .vt-rec-i{margin-bottom:14px}
.tcx .vt-rec-i:last-child{margin-bottom:0}
.tcx .vt-rec-i b{display:block;font-size:12.5px;line-height:18px;font-weight:500;color:var(--i9)}
.tcx .vt-rec-i span{display:block;font-size:11px;line-height:16px;color:#A3A3A8}
@media (max-width:1100px){.tcx .vt-lay{flex-direction:column}.tcx .vt-rail{width:100%}.tcx .vt-main{width:100%}}
@media (max-width:640px){.tcx .vt-prog{width:100%;text-align:left}.tcx .vt-up{width:100%;justify-content:center}}
/* Add project modal (reuses the .lb- shell; matches design "Add project") */
.lb-modal.up .lb-row{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:24px}
.lb-modal.up .lb-row .lb-field{margin-bottom:0;min-width:0}
.lb-modal.up .lb-submit.ap{min-width:143px;padding:0 20px}
.lb-combo{position:relative}
.lb-combo input.lb-control{padding-right:44px}
.lb-combo .lb-cbtn{position:absolute;top:0;right:0;width:44px;height:100%;display:flex;align-items:center;justify-content:center;background:none;border:0;color:#A3A3A8;cursor:pointer;padding:0}
@media (max-width:640px){.lb-modal.up .lb-row{grid-template-columns:1fr;gap:24px}}
@media (max-width:640px){.lb-ov{padding:16px}.lb-foot{gap:12px}.lb-foot .lb-btn{flex:1;min-width:0}.lb-ov.center.disc-overlay{padding:12px}.lb-modal.ask.disc .lb-head{padding:36px 18px 12px}.lb-modal.ask.disc .lb-body{padding:16px 18px 8px}.lb-modal.ask.disc .lb-field{margin-bottom:12px}.lb-modal.ask.disc textarea.lb-control{height:82px}.lb-modal.ask.disc .lb-foot{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding:14px 18px}.lb-modal.ask.disc .lb-foot .lb-btn{width:100%;height:42px;min-width:0;padding:0 12px;flex:none}.lb-modal.ask.disc .lb-close{top:12px;right:12px}}

/* ---------- Contractor profile page (matches design "05 Contractor Profile") ---------- */
.tcx .cp{--cp-purple:#6700A6;--cp-line:#E7E7EA;--cp-ink:#1A1A1A;--cp-mut:#6B7280;--cp-chip:#F1EFF5}
.tcx .cp-back{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:0;margin:0 0 15px;font-family:inherit;font-size:13px;font-weight:500;color:var(--cp-purple);cursor:pointer}
.tcx .cp-back:hover{text-decoration:underline}
.tcx .cp-lay{display:flex;gap:20px;align-items:flex-start}
.tcx .cp-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:20px}
.tcx .cp-rail{width:340px;flex-shrink:0;display:flex;flex-direction:column;gap:20px}
.tcx .cp-card{background:#fff;border:1px solid var(--cp-line);border-radius:12px;padding:24px}
.tcx .cp-card h3{margin:0 0 12px;font-size:16px;line-height:22px;font-weight:600;color:var(--cp-ink)}
.tcx .cp-head{display:flex;gap:20px;align-items:flex-start}
.tcx .cp-logo{width:68px;height:68px;border-radius:8px;background:var(--cp-purple);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:600;flex-shrink:0}
.tcx .cp-id{flex:1;min-width:0}
.tcx .cp-name{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tcx .cp-name h1{margin:0;font-size:22px;line-height:28px;font-weight:600;color:var(--cp-ink)}
.tcx .cp-ver{display:inline-flex;align-items:center;gap:4px;background:#ECFDF5;color:#047857;font-size:11px;font-weight:500;padding:3px 8px;border-radius:999px}
.tcx .cp-role{margin:3px 0 0;font-size:12.5px;line-height:18px;color:var(--cp-purple);font-weight:500}
.tcx .cp-meta{display:flex;align-items:center;flex-wrap:wrap;gap:4px 16px;margin-top:5px;font-size:11.5px;line-height:16px;color:var(--cp-mut)}
.tcx .cp-meta span{display:inline-flex;align-items:center;gap:5px}
.tcx .cp-meta .rt{color:var(--cp-ink)}
.tcx .cp-acts{display:flex;gap:10px;flex-shrink:0;padding-top:13px}
.tcx .cp-btn{height:40px;padding:0 21px;border-radius:6px;font-family:inherit;font-size:13.5px;font-weight:500;line-height:1;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center}
.tcx .cp-btn.fill{background:var(--cp-purple);border:1px solid var(--cp-purple);color:#fff}
.tcx .cp-btn.fill:hover{background:#560088}
.tcx .cp-btn.line{background:#fff;border:1px solid #C9C9CC;color:var(--cp-purple)}
.tcx .cp-btn.line:hover{background:#FAF5FF}
.tcx .cp-btn.full{width:100%}
.tcx .cp-btn:focus-visible,.tcx .cp-back:focus-visible{outline:2px solid var(--cp-purple);outline-offset:2px}
.tcx .cp-stats{display:flex;flex-wrap:wrap;gap:12px 44px;margin-top:20px;padding-top:12px;border-top:1px solid var(--cp-line)}
.tcx .cp-stat b{display:block;font-size:15px;line-height:22px;font-weight:600;color:var(--cp-ink)}
.tcx .cp-stat span{display:block;font-size:12px;line-height:16px;color:#8A8A93}
.tcx .cp-about p{margin:0;font-size:13.5px;line-height:21px;color:var(--cp-mut)}
.tcx .cp-chips{display:flex;flex-wrap:wrap;gap:12px 10px}
.tcx .cp-chip{background:var(--cp-chip);color:#55555E;font-size:12px;line-height:16px;padding:6px 12px;border-radius:999px}
.tcx .cp-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tcx .cp-tile{aspect-ratio:1/0.9;background:var(--cp-chip);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#66666F;text-align:center;padding:8px}
.tcx .cp-resp{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px;line-height:18px;font-weight:500;color:var(--cp-ink)}
.tcx .cp-resp i{width:8px;height:8px;border-radius:50%;background:#059669;flex-shrink:0}
.tcx .cp-rail .cp-btn+.cp-btn{margin-top:14px}
.tcx .cp-info{display:flex;flex-direction:column;gap:14px}
.tcx .cp-row{font-size:13px;line-height:16px;color:#8A8A93}
.tcx .cp-row b{font-weight:600;color:var(--cp-ink);margin-left:3px}
@media (max-width:1024px){.tcx .cp-lay{flex-direction:column}.tcx .cp-rail{width:100%}}
@media (max-width:640px){.tcx .cp-head{flex-wrap:wrap}.tcx .cp-acts{width:100%;padding-top:4px}.tcx .cp-acts .cp-btn{flex:1}.tcx .cp-card{padding:20px}.tcx .cp-gal{grid-template-columns:1fr}.tcx .cp-stats{gap:12px 28px}}

/* Messaging (matches design "10 Messaging") */
@media (min-width:901px){
.tcx .msg{grid-template-columns:319px 1fr;border:1px solid #ECECF0;border-radius:12px;height:calc(100vh - 112px);min-height:520px;margin:-15px 0 -57px}
}
.tcx .ml{border-right:1px solid #ECECF0}
.tcx .ml-head{padding:16px 17px 14px;border-bottom:0}
.tcx .ml-head h2{margin:0 0 11px;font-size:18px;line-height:24px;font-weight:600;color:#111}
.tcx .ml-search{background:#F2F2F5;border-radius:6px;padding:0 13px;height:40px;gap:9px}
.tcx .ml-search input{font-size:13px}
.tcx .mi{gap:12px;padding:0 17px;height:68px;border-bottom:0;background:#fff}
.tcx .mi:hover{background:#FAF8FC}.tcx .mi.on{background:#FAF5FF}
.tcx .mi b{font-size:13px;font-weight:500;color:#1A1A1A}
.tcx .mi-time{font-size:11px;color:#A3A3A8}
.tcx .mi-preview{font-size:12px;line-height:18px;color:#8A8A93;max-width:none;flex:1;min-width:0}
.tcx .mi.unread .mi-preview{color:#1A1A1A}
.tcx .mi-dot{background:#6700A6;margin-right:1px}
.tcx .mt2{background:#FBFBFD;min-height:0;overflow:hidden}
.tcx .mh{background:#fff;padding:0 21px;height:66px;gap:12px;border-bottom:1px solid #ECECF0;flex-shrink:0}
.tcx .mh b{font-size:14px!important;font-weight:500;color:#1A1A1A}
.tcx .mh .mut{font-size:12px;color:#8A8A93;gap:6px}
.tcx .status-dot{width:6px;height:6px}.tcx .status-dot.on{background:#06966A}
.tcx .mh .btn{height:32px;padding:0 13px;border-radius:5px;min-width:100px;font-size:13px;font-weight:500;background:#fff;color:#6700A6;border:1px solid #D9C2EC}
.tcx .mh .btn:hover{background:#FAF5FF}
.tcx .mb{min-height:0;overflow-y:auto;overscroll-behavior:contain;scroll-behavior:smooth;padding:26px 25px;gap:14px;background:#FBFBFD}
.tcx .mb-date{margin-bottom:2px}
.tcx .mb-date span{background:#EEEEF1;color:#8A8A93;font-size:11px;font-weight:500;padding:0 11px;height:18px;line-height:18px;border-radius:999px}
.tcx .bub{max-width:440px;padding:10px 14px;border-radius:12px;font-size:13.5px;line-height:18px;background:#fff;border:1px solid #E7E7EA;color:#1A1A1A;align-self:flex-start}
.tcx .bub.me{align-self:flex-start;background:#6700A6;border-color:#6700A6;color:#fff}
.tcx .mf{padding:15px 21px 15px 22px;border-top:1px solid #ECECF0;gap:12px;background:#fff;flex-shrink:0}
.tcx .mf input{background:#F2F2F5;border:0;border-radius:6px;height:40px;padding:0 16px;font-size:13px}
.tcx .mf input:focus{box-shadow:0 0 0 2px rgba(103,0,166,.18)}
.tcx .mf .btn{height:40px;padding:0;width:75px;border-radius:6px;background:#6700A6;font-size:13px;font-weight:500}
.tcx .mf .btn:hover{background:#560088}
/* Messaging scroll fix: chat history scrolls inside its own pane; header + composer stay pinned */
.tcx .msg{grid-template-rows:minmax(0,1fr)}
@media (min-width:901px){.tcx .msg{height:calc(100vh - 112px);height:calc(100dvh - 112px)}}
@media (max-width:900px){.tcx .msg{height:calc(100vh - 160px);height:calc(100dvh - 160px)}}
.tcx .ml,.tcx .mt2{min-height:0;height:100%}
.tcx .mt2{display:flex;flex-direction:column;overflow:hidden}
.tcx .mh,.tcx .mf{flex:0 0 auto}
.tcx .mb{flex:1 1 0;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y}
.tcx .mb>*{flex-shrink:0}
.tcx .mf{position:relative;z-index:1}
/* ---------- Office Hours & Events: match design "13 Office Hours & Events (Desktop)" ---------- */
.ev-page{margin-top:-12px}
.ev-page .dash-page-head{margin-bottom:21px}
.ev-page .dash-page-head h1{font-size:24px;line-height:32px;font-weight:600;color:#111;margin:0 0 2px}
.ev-page .dash-page-head p{font-size:14px;line-height:20px;color:#6B6B76;max-width:none;margin:0}
.ev-page .ev-nextup-banner{background:linear-gradient(90deg,#6700A6 0%,#8A22C8 100%);border-radius:12px;padding:0 24px;height:114px;margin-bottom:20px;flex-wrap:nowrap}
.ev-page .ev-nextup-banner .eyebrow{font-size:11px;font-weight:600;letter-spacing:.04em;color:#fff;margin-bottom:6px;line-height:14px}
.ev-page .ev-nextup-banner h3{font-size:22px;line-height:30px;font-weight:600;margin:0 0 2px;color:#fff}
.ev-page .ev-nextup-banner .sub{font-size:13px;line-height:18px;color:#F1E4FA}
.ev-page .ev-nextup-actions{gap:12px}
.ev-page .ev-btn-white,.ev-page .ev-btn-whiteline{height:42px;padding:0 24px;border-radius:6px;font-size:14px;font-weight:500;font-family:inherit}
.ev-page .ev-btn-white{background:#fff;color:#6700A6;min-width:102px}
.ev-page .ev-btn-whiteline{border:1px solid rgba(255,255,255,.55);color:#fff;min-width:142px}
.ev-page .learn-filters{margin-bottom:21px}
.ev-page .learn-pill-row{gap:12px}
.ev-page .learn-fpill{height:32px;padding:0 14px;font-size:13px;font-weight:400;color:#4A4A55;border:1px solid #DCDCE2;background:#fff;font-family:inherit}
.ev-page .learn-fpill.active{background:#6700A6;border-color:#6700A6;color:#fff}
.ev-page .course-layout{gap:20px}
.ev-page .ev-list{gap:16px}
.ev-page .ev-card{align-items:flex-start;gap:16px;padding:20px;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.05)}
.ev-page .ev-date-box{width:58px;height:66px;box-sizing:border-box;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FAF5FF;border:1px solid #E6D6F2;border-radius:8px}
.ev-page .ev-date-box .m{font-size:11px;line-height:14px;font-weight:500;color:#6700A6;letter-spacing:.02em}
.ev-page .ev-date-box .d{font-size:22px;line-height:28px;font-weight:600;color:#1A1A1A}
.ev-page .ev-type-pill{font-size:11px;line-height:14px;font-weight:500;padding:3px 8px;border-radius:6px;margin-bottom:4px}
.ev-page .ev-card-body h3{font-size:17px;line-height:24px;font-weight:500;color:#1A1A1A;margin:0 0 1px}
.ev-page .ev-card-host{font-size:12.5px;line-height:18px;color:#7A7A85;margin-bottom:6px}
.ev-page .ev-card-meta{gap:16px;font-size:12.5px;line-height:18px;color:#8A8A93}
.ev-page .ev-card-actions{align-self:flex-start}
.ev-page .ev-register-btn{height:36px;min-width:94px;padding:0 20px;border-radius:6px;background:#6700A6;font-size:13px;font-weight:500;font-family:inherit}
.ev-page .ev-register-btn:hover{background:#560088}
.ev-page .ev-registered-pill{height:36px;box-sizing:border-box;padding:0 20px;gap:8px;border-radius:6px;background:#fff;color:#6700A6;border:1px solid #D9C2EC;font-size:13px;font-weight:500}
.ev-page .ev-sidebar{width:300px;flex-shrink:0;gap:19px}
@media (max-width:960px){.ev-page .ev-sidebar{width:100%}}
.ev-page .ev-side-card{padding:20px;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-page .ev-side-card h4{font-size:15px;line-height:20px;font-weight:500;color:#1A1A1A;margin:0 0 12px}
.ev-page .ev-side-card h4 a{font-size:12.5px;font-weight:500;color:#6700A6}
.ev-page .ev-reg-item{gap:12px;margin-bottom:12px;align-items:flex-start}
.ev-page .ev-reg-item .db{width:46px;height:43px;box-sizing:border-box;padding:0;border-radius:6px;border:1px solid #E6D6F2;background:#FAF5FF;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ev-page .ev-reg-item .db .m{font-size:9px;line-height:11px;font-weight:500;color:#6700A6}
.ev-page .ev-reg-item .db .d{font-size:17px;line-height:20px;font-weight:600;color:#1A1A1A}
.ev-page .ev-reg-item .t{font-size:12.5px;line-height:16px;font-weight:500;color:#1A1A1A;margin-bottom:3px}
.ev-page .ev-reg-item .s{font-size:11px;line-height:14px;color:#8A8A93}
.ev-page .ev-host-item{gap:12px;margin-bottom:12px}
.ev-page .ev-host-item .ava{width:36px;height:36px;font-size:14px}
.ev-page .ev-host-item .hn{font-size:12.5px;line-height:16px;font-weight:500;color:#1A1A1A}
.ev-page .ev-host-item .hr{font-size:11px;line-height:14px;color:#8A8A93}
.ev-page .ev-follow-btn{height:23px;padding:0 12px;border-radius:6px;background:#F3E8FF;color:#6700A6;font-size:11px;font-weight:500;font-family:inherit}
.ev-page .ev-follow-btn.following{background:#F2F2F5;color:#8A8A93}
.ev-page .ev-info-purple{background:#FAF5FF;border:1px solid #E9D5FF;box-shadow:none}
.ev-page .ev-info-purple h4{color:#6700A6;font-size:13.5px;margin-bottom:12px}
.ev-page .ev-info-purple p{font-size:12.5px;line-height:17px;color:#8A8A93;margin:0 0 12px}
.ev-page .ev-info-purple a{font-size:12.5px;font-weight:500;color:#6700A6}
/* ---------- My Events: match design "13d My Events (Desktop)" ---------- */
.ev-page.ev-my{margin-top:-15px}
.ev-page .learn-back{font-size:13px;font-weight:500;color:#6700A6;gap:6px;margin-bottom:17px;font-family:inherit}
.ev-page .learn-back svg{width:12px;height:12px}
.ev-my-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:19px}
.ev-my-head .dash-page-head{margin:0}
.ev-my-head .dash-page-head p{font-size:13.5px}
.ev-browse-btn{height:40px;padding:0 20px;background:#fff;color:#6700A6;border:1px solid #D9D9E0;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;flex:none;box-shadow:0 1px 2px rgba(17,17,20,.04)}
.ev-browse-btn:hover{background:#FAF5FF}
.ev-page .ev-tabs{gap:10px;margin-bottom:21px}
.ev-page .ev-tab{height:32px;padding:0 14px;font-size:13px;font-weight:400;color:#4A4A55;border:1px solid #DCDCE2;border-radius:999px;background:#fff;font-family:inherit;cursor:pointer}
.ev-page .ev-tab.active{background:#6700A6;border-color:#6700A6;color:#fff}
.ev-page .ev-my-card{align-items:flex-start;gap:16px;padding:17px 20px 16px;margin-bottom:16px;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.05)}
.ev-page .ev-my-badges{gap:8px;margin-bottom:5px;align-items:center}
.ev-page .ev-my-badges .ev-type-pill{margin:0}
.ev-page .ev-registered-tag,.ev-page .ev-starts-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;line-height:14px;font-weight:500;padding:3px 8px;border-radius:6px}
.ev-page .ev-registered-tag{background:#DDF6E8;color:#0F8A5F}
.ev-page .ev-starts-tag{background:#FDF0DC;color:#B26A00}
.ev-page .ev-my-actions{gap:8px;align-items:flex-end}
.ev-page .ev-join-btn,.ev-page .ev-addcal-btn{height:36px;padding:0 20px;border-radius:6px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;box-sizing:border-box}
.ev-page .ev-join-btn{background:#6700A6;color:#fff;border:0;min-width:108px}
.ev-page .ev-join-btn:hover{background:#560088}
.ev-page .ev-addcal-btn{background:#fff;color:#6700A6;border:1px solid #D9C2EC;min-width:130px}
.ev-page .ev-addcal-btn:hover{background:#FAF5FF}
.ev-page .ev-cancel-link{font-size:12px;line-height:16px;color:#8A8A93;padding:0;margin-top:2px;font-family:inherit}
.ev-page .ev-my-empty{border:1px solid #ECECF0;border-radius:12px}
.ev-page .ev-activity-row{gap:10px;margin-bottom:14px;font-size:12.5px;line-height:24px;color:#6B6B76}
.ev-page .ev-activity-row b{font-size:22px;line-height:24px;font-weight:600;color:#6700A6;min-width:14px}
.ev-page .ev-activity-num.green{color:#0F8A5F}
.ev-page .ev-activity-num.amber{color:#B26A00}
.ev-page .ev-side-card .tca-btn-primary,.ev-page .ev-side-card .ev-side-cta{width:100%;height:40px;border-radius:6px;background:#6700A6;color:#fff;font-size:13px;font-weight:500;border:0;margin-top:10px;cursor:pointer;font-family:inherit}
.ev-page .ev-side-card .ev-side-cta:hover{background:#560088}
.ev-page .ev-info-purple p{font-size:12px}
/* ---------- Event Detail: match design "13a Event Detail (Desktop)" ---------- */
.ev-page.ev-detail{margin-top:-15px}
.ev-detail .course-layout{gap:20px}
.ev-detail .ev-sidebar{width:340px;flex-shrink:0;gap:19px}
@media (max-width:960px){.ev-detail .ev-sidebar{width:100%}}
.ev-detail .ev-main-card{background:#fff;border:1px solid #ECECF0;border-radius:12px;overflow:hidden;margin-bottom:20px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-detail .ev-hero{height:149px;margin:0;border-radius:0;background:#0f172a}
.ev-detail .ev-hero img{width:100%;height:100%;object-fit:cover;display:block}
.ev-detail .ev-main-body{padding:19px 24px 22px}
.ev-detail .ev-detail-badges{gap:8px;margin-bottom:12px}
.ev-detail .ev-badge{font-size:11px;line-height:14px;font-weight:500;padding:3px 8px;border-radius:6px}
.ev-detail .ev-detail-title{font-size:26px;line-height:34px;font-weight:600;color:#111;margin:0 0 14px}
.ev-detail .ev-host-row{gap:10px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid #ECECF0}
.ev-detail .ev-host-row .h-ava{width:34px;height:34px;border-radius:50%;background:#6700A6;color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ev-detail .ev-host-row .h-by{font-size:13px;color:#1A1A1A}
.ev-detail .ev-verified-pill{background:#DDF6E8;color:#0F8A5F;font-size:11px;line-height:14px;font-weight:500;padding:3px 8px;border-radius:6px;gap:5px}
.ev-detail .ev-meta-grid{display:flex;flex-wrap:wrap;gap:8px 28px;margin:0}
.ev-detail .ev-meta-grid .lbl{font-size:11px;line-height:14px;color:#8A8A93;margin-bottom:5px}
.ev-detail .ev-meta-grid .val{font-size:13px;line-height:18px;font-weight:500;color:#1A1A1A}
.ev-detail .ev-section-card{padding:24px;border:1px solid #ECECF0;border-radius:12px;margin-bottom:20px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-detail .ev-section-card h4{font-size:16px;line-height:22px;font-weight:500;color:#1A1A1A;margin:0 0 12px}
.ev-detail .ev-section-card p{font-size:13.5px;line-height:22px;color:#7A7A85}
.ev-detail .ev-section-card h4.sub{font-size:14px;margin:16px 0 8px}
.ev-detail .ev-learn-list li{gap:11px;font-size:13.5px;line-height:22px;color:#333;margin-bottom:11px;align-items:center}
.ev-detail .ev-learn-list li:last-child{margin-bottom:0}
.ev-detail .ev-learn-list li .dot{width:7px;height:7px;margin-top:2px;background:#6700A6}
.ev-detail .ev-agenda-item{display:flex;gap:0;padding:0;border:0;margin:0;line-height:28px}
.ev-detail .ev-agenda-item .t{width:86px;flex-shrink:0;font-size:13px;font-weight:500;color:#6700A6}
.ev-detail .ev-agenda-item .i{font-size:13px;color:#1A1A1A}
.ev-detail .ev-hostcard-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}
.ev-detail .ev-hostcard-left{display:flex;align-items:center;gap:14px}
.ev-detail .ev-hostcard-left .ava{width:52px;height:52px;background:#6700A6;font-size:22px;font-weight:600;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ev-detail .ev-hostcard-left .hn{font-size:15px;line-height:20px;font-weight:500;color:#1A1A1A;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ev-detail .ev-hostcard-left .hr{font-size:12px;line-height:16px;color:#8A8A93;margin-top:3px}
.ev-detail .ev-viewprofile-btn{height:32px;padding:0 15px;border-radius:6px;background:#fff;color:#6700A6;border:1px solid #D9C2EC;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;flex-shrink:0}
.ev-detail .ev-viewprofile-btn:hover{background:#FAF5FF}
.ev-detail .ev-hostcard-bio{font-size:13.5px;line-height:20px;color:#7A7A85;margin:0}
.ev-detail .ev-side-datecard{background:#fff;border:1px solid #ECECF0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-detail .ev-side-datecard .dt{font-size:18px;line-height:24px;font-weight:600;color:#111;margin:0 0 3px}
.ev-detail .ev-side-datecard .dm{font-size:13px;line-height:18px;color:#6B6B76;margin:0 0 12px}
.ev-detail .ev-attendees-row{display:flex;align-items:center;gap:8px;padding-bottom:13px;margin-bottom:12px;border-bottom:1px solid #ECECF0}
.ev-detail .ev-attendee-stack{display:flex}
.ev-detail .ev-attendee-stack span{width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-left:-9px;color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.ev-detail .ev-attendee-stack span:first-child{margin-left:1px}
.ev-detail .ev-attendees-row .n{font-size:12px;color:#6B6B76}
.ev-detail .ev-side-datecard .ev-register-btn,.ev-detail .ev-side-datecard .ev-registered-pill,.ev-detail .ev-side-datecard .ev-cal-btn{display:flex;align-items:center;justify-content:center;width:100%;height:41px;box-sizing:border-box;border-radius:6px;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer}
.ev-detail .ev-side-datecard .ev-register-btn{background:#6700A6;color:#fff;border:0}
.ev-detail .ev-side-datecard .ev-register-btn:hover{background:#560088}
.ev-detail .ev-side-datecard .ev-registered-pill{background:#fff;color:#6700A6;border:1px solid #D9C2EC;gap:8px;cursor:default}
.ev-detail .ev-side-datecard .ev-cal-btn{background:#fff;color:#6700A6;border:1px solid #D9C2EC;margin-top:12px}
.ev-detail .ev-side-datecard .ev-cal-btn:hover{background:#FAF5FF}
.ev-detail .ev-share-link{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin:12px 0 0;padding:6px 0;background:none;border:0;font-size:12px;color:#6B6B76;cursor:pointer;font-family:inherit}
.ev-detail .ev-freetext{font-size:11.5px;line-height:16px;color:#9A9AA3;text-align:center;margin:6px 0 0}
.ev-detail .ev-side-card{padding:20px;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-detail .ev-side-card h4{font-size:15px;line-height:20px;font-weight:500;color:#1A1A1A;margin:0 0 12px}
.ev-detail .ev-related-item{display:block;width:100%;text-align:left;background:none;border:0;padding:0;margin:0 0 14px;cursor:pointer;font-family:inherit}
.ev-detail .ev-related-item:last-child{margin-bottom:0}
.ev-detail .ev-related-item .rt{font-size:13px;line-height:18px;font-weight:500;color:#1A1A1A}
.ev-detail .ev-related-item .rs{font-size:11px;line-height:16px;color:#8A8A93;margin-top:4px}
.ev-detail .ev-related-item:hover .rt{color:#6700A6}
/* ---------- Past Events & Recordings: match design "13e Past Events & Recordings (Desktop)" ---------- */
.ev-page .ev-rec-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px 20px}
@media (max-width:960px){.ev-page .ev-rec-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.ev-page .ev-rec-grid{grid-template-columns:1fr}}
.ev-page .ev-rec-card{background:#fff;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.05);overflow:hidden}
.ev-page .ev-rec-card:hover{transform:none;box-shadow:0 6px 18px rgba(17,17,20,.09)}
.ev-page .ev-rec-thumb{height:157px}
.ev-page .ev-rec-thumb .playc{width:52px;height:52px;background:rgba(255,255,255,.92)}
.ev-page .ev-rec-thumb .playc svg{margin-left:2px}
.ev-page .ev-rec-thumb .dur{right:16px;bottom:12px;background:rgba(0,0,0,.5);font-size:11px;line-height:17px;font-weight:600;padding:2px 8px;border-radius:4px}
.ev-page .ev-rec-body{padding:16px 20px 14px}
.ev-page .ev-rec-pills{gap:8px;margin-bottom:8px}
.ev-page .ev-rec-pills .ev-type-pill{margin:0;background:#F3E8FF!important;color:#6700A6!important;font-size:11px;line-height:14px;font-weight:500;padding:3px 10px;border-radius:999px}
.ev-page .ev-watched-pill{background:#DDF6E8;color:#0F8A5F;font-size:11px;line-height:14px;font-weight:500;padding:3px 10px;border-radius:999px;gap:5px}
.ev-page .ev-rec-body h3{font-size:15.5px;line-height:22px;font-weight:500;color:#1A1A1A;margin:0 0 2px}
.ev-page .ev-rec-body .h{font-size:12px;line-height:16px;color:#8A8A93}
/* ---------- Recording Player: match design "13i Recording Player (Desktop)" ---------- */
.ev-rp .course-layout{gap:20px}
.ev-rp .ev-sidebar{width:320px;flex-shrink:0;gap:18px}
@media (max-width:960px){.ev-rp .ev-sidebar{width:100%}}
.ev-rp .rp-below{padding:0 20px}
.ev-rp .rp-badges{display:flex;gap:8px;margin:17px 0 8px}
.ev-rp .rp-badges .ev-type-pill{margin:0;background:#F3E8FF!important;color:#6700A6!important;font-size:11px;line-height:14px;font-weight:500;padding:3px 10px;border-radius:999px}
.ev-rp .rp-title{font-size:24px;line-height:32px;font-weight:600;color:#111;margin:0 0 8px}
.ev-rp .rp-host{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.ev-rp .rp-host .h-ava{width:32px;height:32px;border-radius:50%;color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ev-rp .rp-host .h-name{font-size:13px;font-weight:500;color:#1A1A1A;margin-right:4px}
.ev-rp .rp-host .h-date{font-size:12px;color:#8A8A93;margin-left:8px}
.ev-rp .ev-verified-pill{background:#DDF6E8;color:#0F8A5F;font-size:11px;line-height:14px;font-weight:500;padding:3px 8px;border-radius:999px;gap:5px}
.ev-rp .ev-watched-pill{background:#DDF6E8;color:#0F8A5F;font-size:11px;line-height:14px;font-weight:500;padding:3px 10px;border-radius:999px;gap:5px}
.ev-rp .rp-action-row{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:14px}
.ev-rp .rp-action-btn{display:flex;align-items:center;gap:7px;padding:4px 0;background:none;border:0;font-size:13px;font-weight:400;color:#6B6B76;cursor:pointer;font-family:inherit}
.ev-rp .rp-action-btn:hover,.ev-rp .rp-action-btn.active{color:#6700A6}
.ev-rp .ev-section-card{background:#fff;border:1px solid #ECECF0;border-radius:12px;padding:20px;margin-bottom:18px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-rp .ev-section-card h4{font-size:16px;line-height:22px;font-weight:500;color:#1A1A1A;margin:0 0 10px}
.ev-rp .ev-section-card p{font-size:13.5px;line-height:22px;color:#6B6B76;margin:0}
.ev-rp .rp-chapters{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.ev-rp .rp-chapter-item{display:flex;align-items:center;gap:0;height:32px;padding:0 10px;border-radius:6px;font-size:13.5px;font-family:inherit;background:none;border:0;width:100%;text-align:left;cursor:pointer}
.ev-rp .rp-chapter-item:hover{background:#FAF5FF}
.ev-rp .rp-chapter-item .ct{width:68px;flex-shrink:0;font-size:13px;font-weight:400;color:#8A8A93}
.ev-rp .rp-chapter-item .cl{flex:1;font-size:13.5px;color:#4A4A55}
.ev-rp .rp-chapter-item .np{font-size:11px;font-weight:500;color:#6700A6}
.ev-rp .rp-chapter-item.current{background:#FAF5FF}
.ev-rp .rp-chapter-item.current .ct{color:#6700A6;font-weight:500}
.ev-rp .rp-chapter-item.current .cl{color:#1A1A1A;font-weight:500}
.ev-rp .ev-side-card{padding:20px;border:1px solid #ECECF0;border-radius:12px;box-shadow:0 1px 3px rgba(17,17,20,.04)}
.ev-rp .ev-side-card h4{font-size:15px;line-height:20px;font-weight:500;color:#1A1A1A;margin:0 0 12px}
.ev-rp .rp-upnext-item{display:flex;gap:11px;align-items:center;margin-bottom:12px;padding:0;background:none;border:0;text-align:left;width:100%;cursor:pointer;font-family:inherit}
.ev-rp .rp-upnext-item:last-child{margin-bottom:0}
.ev-rp .rp-upnext-thumb{width:74px;height:46px;border-radius:8px;flex-shrink:0}
.ev-rp .rp-upnext-thumb .p{width:22px;height:22px;background:rgba(255,255,255,.92)}
.ev-rp .rp-upnext-info .t{font-size:12.5px;line-height:16px;font-weight:500;color:#1A1A1A;margin-bottom:3px}
.ev-rp .rp-upnext-info .s{font-size:11px;line-height:14px;color:#8A8A93}
.ev-rp .rp-upnext-item:hover .t{color:#6700A6}
.ev-rp .rp-resource-item{display:flex;align-items:center;gap:11px;margin-bottom:12px}
.ev-rp .rp-resource-item:last-child{margin-bottom:0}
.ev-rp .rp-resource-icon{width:34px;height:34px;border-radius:8px;background:#D94A3D;color:#fff;font-size:8.5px;font-weight:700}
.ev-rp .rp-resource-info .n{font-size:12.5px;line-height:16px;font-weight:500;color:#1A1A1A}
.ev-rp .rp-resource-info .s{font-size:11px;line-height:14px;color:#8A8A93;margin-top:3px}
.ev-rp .rp-resource-dl{color:#6700A6;padding:4px}
.ev-rp .ev-info-purple{background:#FAF5FF;border:1px solid #E9D5FF;box-shadow:none}
.ev-rp .ev-info-purple h4{color:#6700A6;font-size:14px;margin-bottom:12px}
.ev-rp .ev-info-purple p{font-size:12px;line-height:17px;color:#8A8A93;margin:0 0 12px}
.ev-rp .ev-info-purple a{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:#6700A6;cursor:pointer}
/* ---------- Shared real video player (.vp2) ---------- */
.vp2{position:relative;border-radius:12px;overflow:hidden;background:#0b0b10;outline:none}
.vp2:focus-visible{box-shadow:0 0 0 3px rgba(103,0,166,.35)}
.vp2 .video-visual{position:relative;aspect-ratio:760/382;background:#0b0b10;display:block;overflow:hidden;cursor:pointer}
.vp2 .vp2-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#0b0b10;display:block}
.vp2 .video-visual::after{content:'';position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(to bottom,rgba(0,0,0,0),rgba(0,0,0,.72));pointer-events:none}
.vp2 .video-play-btn{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.92);border:0;box-shadow:none;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3}
.vp2 .video-play-btn svg{margin-left:3px}
.vp2 .video-play-btn:hover{background:#fff}
.vp2 .vp2-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;background:rgba(11,11,16,.45);pointer-events:none}
.vp2.fs{border-radius:0;height:100vh;display:flex;flex-direction:column}
.vp2.fs .video-visual{flex:1;aspect-ratio:auto}
.vp2 .video-controls{position:absolute;left:0;right:0;bottom:0;z-index:4;display:block;background:none;padding:0 16px 12px}
.vp2 .vc-track{display:block;flex:none;width:100%;height:5px;background:rgba(255,255,255,.28);border-radius:999px;cursor:pointer;position:relative;margin:0 0 12px;touch-action:none}
.vp2 .vc-track::before{content:'';position:absolute;left:0;right:0;top:-9px;bottom:-9px}
.vp2 .vc-fill{height:100%;border-radius:999px;background:#6700A6;position:relative}
.vp2 .vc-fill::after{content:'';position:absolute;right:-6px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);opacity:0;transition:opacity .12s}
.vp2 .vc-track:hover .vc-fill::after,.vp2.scrubbing .vc-fill::after{opacity:1}
.vp2 .vc-row{display:flex;align-items:center;gap:10px;height:24px}
.vp2 .vc-btn{background:none;border:0;cursor:pointer;display:flex;padding:3px;flex-shrink:0}
.vp2 .vc-time{font-size:13px;color:#fff;margin-left:2px;white-space:nowrap;font-variant-numeric:tabular-nums}
.vp2 .vc-spacer{flex:1}
.vp2 .vc-volume-wrap{display:flex;align-items:center}
.vp2 .vc-volume-slider{width:72px;margin-right:4px;accent-color:#fff;cursor:pointer}
/* member profile (people who are not contractors) */
.tcx .cp-mem .cp-logo{border-radius:50%}

/* ---------- Profile page ---------- */
.tcx .hp-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;background:var(--p0);border:1px solid var(--p1);border-radius:14px;padding:26px 28px;margin-bottom:24px}
.tcx .hp-hero h2{font-size:18px;color:var(--p9);margin-bottom:6px}
.tcx .hp-hero p{font-size:13.5px;line-height:1.65;color:var(--i6);max-width:640px}
.tcx .hp-search{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:0 14px;height:48px;margin-bottom:16px}
.tcx .hp-search:focus-within{border-color:var(--p6);box-shadow:0 0 0 3px rgba(106,13,173,.12)}
.tcx .hp-search input{flex:1;border:0;outline:0;background:transparent;font-size:14px;font-family:inherit;color:var(--i9)}
.tcx .hp-cats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px}
@media (max-width:900px){.tcx .hp-cats{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.tcx .hp-cats{grid-template-columns:1fr}}
.tcx .hp-cat{display:flex;align-items:flex-start;gap:12px;text-align:left;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:16px;cursor:pointer;font-family:inherit;transition:border-color .15s ease,box-shadow .15s ease}
.tcx .hp-cat:hover{border-color:var(--p6)}
.tcx .hp-cat.on{border-color:var(--p6);background:var(--p0);box-shadow:0 0 0 1px var(--p6) inset}
.tcx .hp-cat .ic{width:36px;height:36px;border-radius:9px;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tcx .hp-cat b{display:block;font-size:14px;color:var(--i9);margin-bottom:2px}
.tcx .hp-cat span{font-size:12.5px;color:var(--i6);line-height:1.5}
.tcx .hp-layout{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);gap:24px;align-items:start}
@media (max-width:1000px){.tcx .hp-layout{grid-template-columns:1fr}}
.tcx .hp-faq{border-top:1px solid var(--ln)}
.tcx .hp-faq:first-of-type{border-top:0}
.tcx .hp-q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;background:none;border:0;padding:16px 0;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:600;color:var(--i9);text-align:left}
.tcx .hp-q:hover{color:var(--p7)}
.tcx .hp-chev{width:8px;height:8px;border-right:2px solid var(--i4);border-bottom:2px solid var(--i4);transform:rotate(45deg);transition:transform .18s ease;flex-shrink:0;margin-right:4px}
.tcx .hp-faq.open .hp-chev{transform:rotate(-135deg);border-color:var(--p7)}
.tcx .hp-a{padding:0 0 18px;font-size:13.5px;line-height:1.7;color:var(--i6);max-width:640px}
.tcx .hp-a .lk{margin-top:10px;background:none;border:0;padding:0;color:var(--p7);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit}
.tcx .hp-a .lk:hover{text-decoration:underline}
.tcx .hp-empty{padding:28px 0 8px;text-align:center;color:var(--i6);font-size:13.5px}
.tcx .hp-contact{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:14px;cursor:pointer;font-family:inherit;margin-bottom:12px}
.tcx .hp-contact:hover{border-color:var(--p6)}
.tcx .hp-contact .ic{width:36px;height:36px;border-radius:9px;background:transparent;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tcx .hp-contact b{display:block;font-size:13.5px;color:var(--i9)}
.tcx .hp-contact span{font-size:12.5px;color:var(--i6)}
.tcx .profile-card{background:#fff;border:1px solid var(--ln);border-radius:16px;overflow:hidden;margin-bottom:24px;position:relative}
.tcx .profile-close{position:absolute;top:14px;right:14px;z-index:2;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.22);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);transition:background .15s ease}
.tcx .profile-close:hover{background:rgba(255,255,255,.38)}
.tcx .profile-close:focus-visible{outline:2px solid #fff;outline-offset:2px}
.tcx .profile-banner{height:120px;background:linear-gradient(120deg,var(--p7) 0%,#9B4DD6 100%)}
.tcx .profile-header{padding:0 28px 24px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-top:-34px}
.tcx .profile-avatar{width:72px;height:72px;border-radius:50%;border:4px solid #fff;background:var(--p7);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;flex-shrink:0}
.tcx .profile-name{font-size:19px;font-weight:700;margin:14px 0 2px}
.tcx .profile-tagline{color:var(--p6);font-weight:600;font-size:13.5px;margin-bottom:6px}
.tcx .profile-meta{color:var(--i4);font-size:12.5px;display:flex;gap:16px;flex-wrap:wrap}
.tcx .profile-meta span{display:inline-flex;align-items:center;gap:5px}
.tcx .profile-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;align-items:start}
.tcx .profile-progress-bar{height:8px;background:#fff;border:1px solid var(--p1);border-radius:999px;overflow:hidden;margin:10px 0 16px}
.tcx .profile-progress-bar span{display:block;height:100%;background:var(--p7)}
.tcx .profile-step{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px;color:var(--i6)}
.tcx .profile-step:last-child{margin-bottom:0}
.tcx .profile-step .dot{width:20px;height:20px;border-radius:50%;border:2px solid #fff;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff}
.tcx .profile-step.done .dot{background:#10B981;border-color:#10B981;color:#fff}
.tcx .profile-step.pending{color:var(--p7);font-weight:600;cursor:pointer}
.tcx .profile-step.pending .dot{border-color:var(--p6)}
.tcx .profile-activity-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--ln);font-size:13.3px;color:var(--i6)}
.tcx .profile-activity-row:last-child{border-bottom:0;padding-bottom:0}
.tcx .profile-stats{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.tcx .profile-stats > div b{font-size:24px;display:block;margin-bottom:4px;color:var(--i9)}
@media (max-width:900px){.tcx .profile-grid{grid-template-columns:1fr}}
@media (max-width:480px){.tcx .profile-header{flex-direction:column;align-items:flex-start}.tcx .profile-header > .btn{width:100%}}

/* ================= Responsive layer: phones, tablets, laptops, large & touch screens ================= */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
.tca{overflow-x:clip;-webkit-tap-highlight-color:transparent}
:where(.tca) img,:where(.tca) video{max-width:100%}
.tca h1,.tca h2,.tca h3,.tca h4,.tca p{overflow-wrap:break-word}
.tca button,.tca a,.tca label{touch-action:manipulation}

/* dynamic viewport units (browsers without dvh keep the 100vh rules above) */
.tca-shell,.tca-onboard,.dash-app{min-height:100dvh}
.dash-sidebar{height:100dvh}
.sd-drawer,.tcx .dr{height:100dvh;width:min(600px,100vw);max-width:100vw}
.video-player.fs,.vp2.fs{height:100dvh}
.modal-card{max-height:90dvh}
.tcx .md{max-height:calc(100dvh - 32px);overflow-y:auto}

/* mobile menu button lives in the top bar (hidden on tablet/desktop) */
.dash-mobile-menu{display:none;align-items:center;justify-content:center;width:40px;height:40px;margin-left:-8px;background:none;border:0;border-radius:10px;color:var(--ink-700);cursor:pointer;flex-shrink:0}
.dash-mobile-menu:hover{background:var(--bg)}

/* large screens: keep content centred and readable */
@media (min-width:1440px){.dash-content{margin-left:0;margin-right:auto;max-width:1300px}}
@media (min-width:1920px){.dash-content{max-width:1440px}.tca-form-col{max-width:420px}}

/* tablets & small laptops: respect notches / rounded corners in landscape */
@media (max-width:1023px){
  .dash-topbar{padding-left:max(24px,env(safe-area-inset-left));padding-right:max(24px,env(safe-area-inset-right))}
  .dash-content{padding-left:max(24px,env(safe-area-inset-left));padding-right:max(24px,env(safe-area-inset-right));padding-bottom:calc(64px + env(safe-area-inset-bottom))}
  .tca-toast{bottom:calc(22px + env(safe-area-inset-bottom));right:max(22px,env(safe-area-inset-right))}
  .dash-sidebar{padding-top:calc(22px + env(safe-area-inset-top));padding-bottom:calc(22px + env(safe-area-inset-bottom))}
  .dash-topbar{padding-top:calc(11px + env(safe-area-inset-top))}
}

/* phones: sidebar becomes an off-canvas drawer opened from the top bar */
@media (max-width:767px){
  .dash-main{width:100%;margin-left:0}
  .dash-sidebar.collapsed+.dash-main{width:100%;margin-left:0}
  .dash-mobile-menu{display:flex}
  .dash-sidebar,.dash-sidebar.collapsed{position:fixed;left:0;top:0;bottom:0;width:272px;max-width:84vw;z-index:75;
    transform:translateX(-102%);visibility:hidden;box-shadow:none;transition:transform .22s ease,visibility 0s linear .22s}
  .dash-sidebar.open,.dash-sidebar.open.collapsed{transform:none;visibility:visible;width:272px;box-shadow:8px 0 30px rgba(0,0,0,.18);transition:transform .22s ease}
  .dash-sidebar.open .dash-brand-row,.dash-sidebar.open.collapsed .dash-brand-row{flex-direction:row;justify-content:space-between;padding:0 6px 22px}
  .dash-sidebar.open .dash-brand,.dash-sidebar.open.collapsed .dash-brand{justify-content:flex-start}
  .dash-sidebar.open .dash-brand .word,.dash-sidebar.open .dash-navitem .lbl,.dash-sidebar.open .dash-navlabel,
  .dash-sidebar.open.collapsed .dash-brand .word,.dash-sidebar.open.collapsed .dash-navitem .lbl,.dash-sidebar.open.collapsed .dash-navlabel{display:inline}
  .dash-sidebar.open .dash-navitem,.dash-sidebar.open.collapsed .dash-navitem{justify-content:flex-start;padding:12px}
  .dash-sidebar.open .dash-logo-crop,.dash-sidebar.open.collapsed .dash-logo-crop{width:155px}
  .dash-topbar{gap:10px;padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right))}
  .dash-content{padding-left:max(18px,env(safe-area-inset-left));padding-right:max(18px,env(safe-area-inset-right))}
  .dash-searchbar{padding:8px 12px;min-width:0}
  .dash-page-head h1,.tcx .ph h1{font-size:22px}
  .dash-banner h1{font-size:21px}
  .dash-banner{padding:26px 22px;margin-bottom:28px}
  .dash-stats-grid,.dash-cards-grid,.dash-notsure-grid,.learn-grid{gap:14px}
  .learn-fpill{padding:9px 14px}
  .learn-filters{align-items:stretch}
  .learn-pill-row{flex-wrap:nowrap;overflow-x:auto;margin-inline:-18px;padding-inline:18px;scrollbar-width:none;width:calc(100% + 36px)}
  .learn-pill-row::-webkit-scrollbar{display:none}
  .learn-fpill{flex-shrink:0;white-space:nowrap}
  .learn-continue-banner .bar{width:100%}
  .learn-resume-btn{width:100%;justify-content:center}
  .tca-toast{left:12px;right:12px;max-width:none;bottom:calc(16px + env(safe-area-inset-bottom))}
  .tca-otp-row{gap:8px}
  .lb-modal.ok{max-width:100%}
  .vt-proj-right{min-width:0;text-align:left;width:100%}
  .learn-sort-menu,.cd-filter-menu{max-width:calc(100vw - 32px)}
  .video-controls{gap:8px;padding:8px 12px}
  .vc-volume-slider{display:none}
  .modal-overlay,.tcx .ov{padding:12px}
  .tcx .md{padding:22px 18px}
  .tour-card{padding:56px 18px 18px}
  .tour-desc{min-height:0;margin-bottom:22px}
}
@media (max-width:600px){
  .dash-notif-panel{position:fixed;top:calc(64px + env(safe-area-inset-top));right:8px;left:8px;width:auto;max-height:calc(100dvh - 80px);overflow-y:auto}
}

/* small phones (<= 360px) */
@media (max-width:360px){
  .tca-form-panel{padding:36px 16px}
  .tca-h1,.tca-success-h1,.tca-onboard-h1{font-size:23px}
  .tca-otp-box{width:38px;height:46px;font-size:16px}
  .tca-pill{padding:9px 13px}
  .dash-content{padding-left:14px;padding-right:14px}
  .dash-topbar-right{gap:8px}
  .dash-stat-card .value{font-size:21px}
}

/* short landscape screens (phones on their side) */
@media (max-height:520px) and (orientation:landscape){
  .tca-form-panel,.tca-onboard-body{align-items:flex-start;padding-top:24px;padding-bottom:24px}
  .tour-card{max-height:calc(100dvh - 16px);overflow-y:auto}
  .tour-desc{min-height:0;margin-bottom:16px}
  .video-player:not(.fs) .video-visual{aspect-ratio:16/7}
}
.tour-card{max-height:calc(100dvh - 16px);overflow-y:auto}

/* touch devices: bigger hit areas, no sticky hover, no iOS focus-zoom */
@media (pointer:coarse){
  .tca input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),.tca select,.tca textarea{font-size:16px!important}
  .tca-checkbox input,.tca input[type=checkbox],.tca input[type=radio]{width:20px;height:20px}
  .dash-collapse-btn{padding:10px}
  .dash-bell-btn{padding:10px;margin:-10px}
  .tca-eye{padding:10px;right:6px}
  .tour-close{width:32px;height:32px;top:17px;right:17px}
  .modal-close-x{width:38px;height:38px}
  .vc-btn{padding:8px}
  .tour-back-btn,.tour-next-btn{height:44px}
  .dash-navitem{min-height:44px}
  .tca-pill,.learn-fpill{min-height:42px}
  .tca-link,.tca-backlink,.tca-skip,.learn-back{padding-top:8px;padding-bottom:8px}
}
@media (hover:none){
  .learn-card:hover{transform:none;box-shadow:none}
  .tca-pill:hover,.tca-google-btn:hover,.tca-btn-outline:hover{background:inherit}
}
.dash-banner.homepage-hero{aspect-ratio:3.36/1;padding:0!important;background:none!important;overflow:hidden;border-radius:16px;position:relative}
.homepage-hero-track{display:flex;width:100%;height:100%;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.homepage-hero-slide{position:relative;flex:0 0 100%;min-width:0;height:100%;overflow:hidden}
.homepage-hero-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:top center}
.homepage-hero-slide.photo-slide::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,35,33,.74),rgba(15,35,33,.18) 74%,transparent)}
.homepage-hero-caption{position:absolute;z-index:1;inset:0;display:flex;align-items:center;padding:32px 44px;color:#fff}
.homepage-hero-caption h2{max-width:520px;margin:0;font-size:28px;line-height:1.2;font-weight:700}
.homepage-hero-dots{position:absolute;z-index:2;right:20px;bottom:18px;display:flex;align-items:center;gap:7px}
.homepage-hero-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.62);cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.24)}
.homepage-hero-dot.active{width:20px;border-radius:999px;background:#fff}
.homepage-hero-dot:focus-visible{outline:2px solid #fff;outline-offset:3px}
@media (max-width:640px){.dash-banner.homepage-hero{aspect-ratio:2.94/1}.homepage-hero-slide.intro-slide img{object-fit:contain;background:#f7f7f8}.homepage-hero-caption{padding:12px 14px 34px}.homepage-hero-caption h2{max-width:260px;font-size:17px}.homepage-hero-dots{right:12px;bottom:10px}}
@media print{.dash-sidebar,.dash-topbar,.tca-toast,.tour-card,.tour-dim,.tour-click-block{display:none!important}.dash-content{max-width:none;padding:0}}
`;

/* ============================================================
   Icons — plain inline SVGs shared across auth, dashboard and tour
   ============================================================ */
const ICON_PATHS = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-7h6v7" /></>,
  book: <><path d="M3 5.5h18v13H3z" /><path d="M12 5.5V20.5" /></>,
  users: <><circle cx="7.5" cy="8" r="2.6" /><circle cx="16.5" cy="8" r="2.6" /><rect x="3" y="14" width="18" height="5" rx="2.5" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>,
  message: <><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-4.5 3.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M7.5 9h9M7.5 12.5h5.5" /></>,
  shield: <path d="M12 3c2.2 1.5 4.7 2.2 7.5 2.2V11c0 4.3-3 7.6-7.5 10-4.5-2.4-7.5-5.7-7.5-10V5.2C7.3 5.2 9.8 4.5 12 3z" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /><path d="M9 7v13M15 7v13" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.6-2.4 1.9-2.4 3.2" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  link: <><path d="M9 15l6-6" /><path d="M8 12l-2 2a3 3 0 0 0 4 4l2-2" /><path d="M16 12l2-2a3 3 0 0 0-4-4l-2 2" /></>,
  upload: <><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M4 21h16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  play: <path d="M7.5 5.2v13.6a1 1 0 0 0 1.52.85l11.2-6.8a1 1 0 0 0 0-1.7L9.02 4.35A1 1 0 0 0 7.5 5.2z" fill="currentColor" stroke="none" />,
  pause: <><rect x="6.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none" /><rect x="13.5" y="4.5" width="4" height="15" rx="1.4" fill="currentColor" stroke="none" /></>,
  volume: <><path d="M11 5 6.5 9H3v6h3.5L11 19V5z" fill="currentColor" /><path d="M15.5 9.2a4 4 0 0 1 0 5.6" /><path d="M18.4 6.4a8 8 0 0 1 0 11.2" /></>,
  volumeMute: <><path d="M11 5 6.5 9H3v6h3.5L11 19V5z" fill="currentColor" /><path d="m16 9.5 5 5" /><path d="m21 9.5-5 5" /></>,
  expand: <><path d="M15 3.5h5.5V9" /><path d="M9 20.5H3.5V15" /><path d="m20.5 3.5-6.5 6.5" /><path d="m3.5 20.5 6.5-6.5" /></>,
  collapse: <><path d="M20.5 9H15V3.5" /><path d="M3.5 15H9v5.5" /><path d="m15 9 5.5-5.5" /><path d="m9 15-5.5 5.5" /></>,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />,
  heartFilled: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" fill="currentColor" stroke="none" />,
  bookmark: <><rect x="3.5" y="3" width="17" height="18" rx="2.5" /><path d="M8 3v5h8V3M7.5 21v-6h9v6" /></>,
  bookmarkFilled: <><rect x="3.5" y="3" width="17" height="18" rx="2.5" fill="currentColor" stroke="none" /><path d="M8 3v5h8V3M7.5 21v-6h9v6" stroke="#fff" /></>,
  download: <><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 21h16" /></>,
  share: <path d="M7 17L17 7M9 7h8v8" />,
  mapPin: <><path d="M12 22s7-6.8 7-12a7 7 0 1 0-14 0c0 5.2 7 12 7 12z" /><circle cx="12" cy="10" r="2.3" /></>,
  star: <path d="M12 3l2.6 5.9 6.4.6-4.9 4.3 1.5 6.3L12 16.9 6.4 20l1.5-6.3L3 9.4l6.4-.6z" />,
  image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="M21 16l-5-5-4 4-3-3-6 6" /></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  award: <><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5L7 21l5-3 5 3-1.5-8.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  laptop: <><rect x="4" y="3" width="16" height="12" rx="1.5" /><path d="M2 19h20" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></>,
  bell: <><path d="M5.5 17h13l-1.6-2.4V10a4.9 4.9 0 0 0-9.8 0v4.6z" /><path d="M10.2 20.3a2 2 0 0 0 3.6 0" /></>,
  arrowLeft: <path d="M19 12H5M10.5 7L5.5 12l5 5" />,
  arrowRight: <path d="M5 12h14M13.5 7l5 5-5 5" />,
  eye: <><path d="M3 13.5C5 10 8 8 12 8s7 2 9 5.5" /><circle cx="12" cy="13.5" r="2.2" fill="currentColor" stroke="none" /></>,
  starFilled: <path d="M12 3l2.6 5.9 6.4.6-4.9 4.3 1.5 6.3L12 16.9 6.4 20l1.5-6.3L3 9.4l6.4-.6z" fill="currentColor" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  archive: <><path d="M21 8L12 3 3 8l9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
};
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 2, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ color, flexShrink: 0 }}>
      {ICON_PATHS[name]}
    </svg>
  );
}

function Ava({ c = '#5B21B6', t = 'M', s = 36 }) {
  return <div className="ava" aria-hidden="true" style={{ width: s, height: s, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: c, color: '#fff', fontSize: Math.max(10, Math.round(s * 0.38)), fontWeight: 700 }}>{t || 'M'}</div>;
}

/* Drop-in replacements for the lucide icons the design also defines,
   so every existing <Search/>, <Bell/>, <ArrowLeft/>, <ArrowRight/>, <Check/> call
   site now renders the design's version. */
const Search = ({ size = 16, color, strokeWidth }) => <Icon name="search" size={size} color={color} strokeWidth={strokeWidth} />;
const Bell = ({ size = 16, color, strokeWidth }) => <Icon name="bell" size={size} color={color} strokeWidth={strokeWidth} />;
const ArrowLeft = ({ size = 16, color, strokeWidth }) => <Icon name="arrowLeft" size={size} color={color} strokeWidth={strokeWidth} />;
const ArrowRight = ({ size = 16, color, strokeWidth }) => <Icon name="arrowRight" size={size} color={color} strokeWidth={strokeWidth} />;
const Check = ({ size = 16, color, strokeWidth }) => <Icon name="check" size={size} color={color} strokeWidth={strokeWidth} />;

/* Brand mark from the design: open gradient ring with a T whose stem sweeps into the ring */
/* Brand assets (uploaded logo + auth mockup, embedded so the file stays self-contained) */
const LOGO_SRC = 'data:image/png;base64,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';
const MOCKUP_SRC = 'data:image/png;base64,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';

function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="tc-mark-grad" x1="4" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B3FBF" />
          <stop offset="1" stopColor="#A21CAF" />
        </linearGradient>
      </defs>
      <path d="M24.6 25.2A12 12 0 1 0 16 28" stroke="url(#tc-mark-grad)" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.5 12.5h11M16 12.5V22" stroke="url(#tc-mark-grad)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.5 7.1 29.5 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z" />
      <path fill="#4CAF50" d="M24 43c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 34 26.8 35 24 35c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 38.5 16.2 43 24 43z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.3C40.9 36.6 44 31 44 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function Logo({ centered = true }) {
  return (
    <div className={`tca-logo${centered ? ' center' : ''}`}>
      <img className="tca-logo-img" src={LOGO_SRC} alt="Tribes Capital" width={155} height={18} />
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, inputMode }) {
  return (
    <div className="tca-field">
      <label>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, show, onToggle, autoComplete }) {
  return (
    <div className="tca-field">
      <label>{label}</label>
      <div className="tca-pwd-wrap">
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
        <button type="button" className="tca-eye" onClick={onToggle} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
        </button>
      </div>
    </div>
  );
}

function PrimaryButton({ children, enabled = true, onClick, icon }) {
  return (
    <button type="button" onClick={enabled ? onClick : undefined} aria-disabled={!enabled} className={`tca-btn-primary${enabled ? '' : ' disabled'}`}>
      {children}
      {icon}
    </button>
  );
}

function GoogleButton({ onClick, children }) {
  return (
    <button type="button" className="tca-google-btn" onClick={onClick}>
      <GoogleIcon />
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="tca-divider">
      <span className="line" />
      <span>or</span>
      <span className="line" />
    </div>
  );
}

function BackLink({ onClick, children }) {
  return (
    <div className="tca-backlink-row">
      <button type="button" className="tca-backlink" onClick={onClick}>
        <ArrowLeft size={14} color="#5B21B6" />
        {children}
      </button>
    </div>
  );
}

function StepDots({ current, total = 3 }) {
  return (
    <div className="tca-steps">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`tca-dot${i + 1 === current ? ' active' : ''}`} />
      ))}
      <span className="steplabel">Step {current} of {total}</span>
    </div>
  );
}

function Pill({ label, selected, onClick }) {
  return (
    <button type="button" className={`tca-pill${selected ? ' selected' : ''}`} onClick={onClick}>
      <span className="radio-dot">{selected && <span className="inner" />}</span>
      {label}
    </button>
  );
}

function ReqItem({ met, children }) {
  return (
    <div className="tca-req-item">
      <span className={`tca-req-dot${met ? ' met' : ''}`}>{met && <Check size={10} color="#fff" strokeWidth={3} />}</span>
      <span className={`txt${met ? ' met' : ''}`}>{children}</span>
    </div>
  );
}

function OutlineButton({ children, onClick }) {
  return (
    <button type="button" className="tca-btn-outline" onClick={onClick}>
      {children}
    </button>
  );
}

function DashboardPreviewCard() {
  const chips = ['#8B5CF6', '#14B8A6', '#3B82F6', '#F59E0B', '#F472B6', '#6366F1'];
  return (
    <div className="tca-mock-card">
      <div className="tca-mock-top">
        <div className="l">
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#5B21B6', display: 'block' }} />
          <span className="tca-mbar" style={{ width: 40 }} />
        </div>
        <div className="r">
          <span className="tca-mbar" style={{ width: 60 }} />
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#7C3AED', display: 'block' }} />
        </div>
      </div>
      <div className="tca-mock-banner">
        <div className="b1" />
        <div className="b2" />
        <div className="tca-mock-pills"><span /><span /><span /></div>
      </div>
      <div className="tca-mock-stats">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="tca-mock-stat"><div className="a" /><div className="b" /></div>
        ))}
      </div>
      <div className="tca-mock-cards">
        {chips.map((c, i) => (
          <div key={i} className="tca-mock-mini">
            <div className="dot" style={{ background: c }} />
            <div className="a" />
            <div className="b" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Layout shells (auth)
   ============================================================ */

function AuthShell({ leftHeading, showLogo = true, children }) {
  return (
    <div className="tca-shell">
      <div className="tca-left">
        <div />
        <div className="tca-mockup-wrap"><img className="tca-mockup" src={MOCKUP_SRC} alt="Preview of the Tribes Capital dashboard" width={562} height={383} /></div>
        <div className="tca-left-heading">
          <h2>{leftHeading}</h2>
          <p>Learn about renewable energy, connect with verified contractors, and take real action — all in one place.</p>
        </div>
      </div>
      <div className="tca-form-panel">
        <div className="tca-form-col">
          {showLogo && <Logo />}
          {children}
        </div>
      </div>
    </div>
  );
}

function OnboardingShell({ onSkip, children }) {
  return (
    <div className="tca-onboard">
      <div className="tca-onboard-top">
        <Logo centered={false} />
        <button type="button" className="tca-skip" onClick={onSkip}>Skip for now</button>
      </div>
      <div className="tca-onboard-body">
        <div className="tca-onboard-col">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className={`tca-toast${message ? ' show' : ''}`}>
      <span className="chip"><Check size={15} color="#5B21B6" strokeWidth={2.5} /></span>
      <span className="msg">{message}</span>
    </div>
  );
}

/* ============================================================
   App shell (sidebar + topbar), shared by Dashboard & Learning
   ============================================================ */

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'learning', label: 'Learning', icon: 'book' },
  { key: 'pipeline', label: 'Portfolio', icon: 'briefcase' },
  { key: 'community', label: 'Forum', icon: 'users' },
  { key: 'events', label: 'Office Hours & Events', icon: 'calendar' },
  { key: 'submit-project', label: 'Submit Your Project', icon: 'upload' },
];
const INVESTOR_NAV_ITEMS = [
  { key: 'vault', label: 'Due Diligence Vault', icon: 'shield' },
];

function notificationTime(value) {
  if (!value) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function notificationIcon(type = '') {
  if (type.includes('message')) return 'message';
  if (type.includes('event') || type.includes('calendar')) return 'calendar';
  if (type.includes('due-diligence') || type.includes('document')) return 'shield';
  if (type.includes('community') || type.includes('follow')) return 'users';
  return 'bell';
}

function NotificationsMenu({ onOpenMessaging, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapRef = useRef(null);
  const unreadCount = items.filter((notification) => !notification.isRead).length;
  const loadNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await notificationsAPI.list();
      const payload = response?.data?.data ?? response?.data ?? [];
      setItems(Array.isArray(payload) ? payload : []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadNotifications(open);
    const handleNotificationsUpdate = () => { void loadNotifications(false); };
    const handleOpenNotifications = () => setOpen(true);
    window.addEventListener('tribes:notifications-update', handleNotificationsUpdate);
    window.addEventListener('tribes:open-notifications', handleOpenNotifications);
    return () => {
      window.removeEventListener('tribes:notifications-update', handleNotificationsUpdate);
      window.removeEventListener('tribes:open-notifications', handleOpenNotifications);
    };
  }, [loadNotifications, open]);
  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setItems((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark notifications as read.');
    }
  };
  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to update this notification.');
      }
    }
    setOpen(false);
    const page = notification.data?.page;
    if (page) onNavigate(page);
    else if (notification.type?.includes('message')) onOpenMessaging();
  };
  return (
    <div className="dash-notif-wrap" ref={wrapRef}>
      <button className="dash-bell-btn" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="dash-bell-wrap"><Bell size={28} color="#344054" strokeWidth={2.2} />{unreadCount > 0 && <span className="dash-bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</span>
      </button>
      {open && (
        <div className="dash-notif-panel" role="menu">
          <div className="dash-notif-head">
            <div className="dash-notif-heading"><h4>Notifications</h4><span className="dash-notif-unread-count">{loading ? 'Checking for updates…' : `${unreadCount} unread`}</span></div>
            <button type="button" className="dash-notif-mark" disabled={!unreadCount} onClick={() => void markAllRead()}>Mark all read</button>
          </div>
          <div className="dash-notif-list">
            {loading && <p role="status" className="dash-notif-empty">Loading notifications…</p>}
            {error && <div role="alert" className="dash-notif-error-card"><div><strong>Couldn’t load notifications</strong><p>Check your connection and try again.</p></div><button type="button" disabled={loading} onClick={() => void loadNotifications(true)}>{loading ? 'Retrying…' : 'Retry'}</button></div>}
            {!loading && !error && items.length === 0 && <p className="dash-notif-empty">No notifications yet.</p>}
            {items.map((notification) => (
              <button type="button" className={`dash-notif-item${notification.isRead ? '' : ' unread'}`} key={notification.id} onClick={() => void openNotification(notification)}>
                <span className="ic"><Icon name={notificationIcon(notification.type)} size={15} /></span>
                <span className="sp">
                  <span className="dash-notif-title">{notification.message || notification.title}</span>
                  <span className="dash-notif-meta">{notificationTime(notification.createdAt)}</span>
                </span>
                {!notification.isRead && <span className="dash-notif-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppShell({ navRefs, sidebarRef, onOpenHelp, activeKey, onNavigate, onSearch, onLogout, onOpenProfile, user, children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState('');
  const go = (k) => { setOpen(false); onNavigate(k); };
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);
  const toggleSidebar = () => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (isDesktop) setCollapsed((c) => !c); else setOpen((o) => !o);
  };
  const item = (it) => (
    <button key={it.key} ref={(el) => { navRefs.current[it.key] = el; }} className={`dash-navitem${it.key === activeKey ? ' active' : ''}`} aria-current={it.key === activeKey ? 'page' : undefined} onClick={() => go(it.key)} title={it.label}>
      <Icon name={it.icon} size={22} color="currentColor" strokeWidth={2.3} /><span className="lbl">{it.label}</span>
    </button>
  );
  const visibleNavItems = user?.accountType === 'GUEST'
    ? NAV_ITEMS.filter((navItem) => navItem.key !== 'submit-project')
    : NAV_ITEMS;
  const visibleInvestorItems = user?.accountType === 'INVESTOR' ? INVESTOR_NAV_ITEMS : [];
  return (
    <div className={`dash-app${activeKey === 'messaging' ? ' messaging-app' : ''}`}>
      {open && <div className="dash-scrim" onClick={() => setOpen(false)} />}
      <aside className={`dash-sidebar${open ? ' open' : ''}${collapsed ? ' collapsed' : ''}`} ref={sidebarRef}>
        <div className="dash-brand-row">
          <button className="dash-brand" onClick={() => go('home')} title="Tribes Capital"><span className="dash-logo-crop"><img className="dash-logo-img" src={LOGO_SRC} alt="Tribes Capital" width={155} height={18} /></span></button>
          <button className="dash-collapse-btn" aria-label={open || !collapsed ? 'Collapse menu' : 'Expand menu'} onClick={toggleSidebar}><Menu size={19} /></button>
        </div>
        <nav className="dash-navgroup" aria-label="Main">{visibleNavItems.map(item)}</nav>
        {visibleInvestorItems.length > 0 && <div className="dash-navgroup"><div className="dash-navlabel">INVESTOR TOOLS</div>{visibleInvestorItems.map(item)}</div>}
        <div className="dash-sidebar-bottom">
          <button className={`dash-navitem${activeKey === 'help' ? ' active' : ''}`} aria-current={activeKey === 'help' ? 'page' : undefined} onClick={() => { setOpen(false); onOpenHelp(); }} title="Help"><Icon name="help" size={20} /><span className="lbl">Help</span></button>
          {item({ key: 'settings', label: 'Settings', icon: 'settings' })}
          <button className="dash-navitem" onClick={onLogout} title="Log out"><LogOut size={16} /><span className="lbl">Log out</span></button>
        </div>
      </aside>
      <div className={`dash-main${activeKey === 'learning' ? ' learning-hub-main' : ''}`}>
        <header className="dash-topbar">
          <button className="dash-mobile-menu" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button>
          <form className="dash-searchbar" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(q.trim()); setQ(''); }}>
            <Search size={18} color="#9CA3AF" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contractors, topics, people, events…" aria-label="Search" />
          </form>
          <div className="dash-topbar-right">
            <NotificationsMenu onOpenMessaging={() => go('messaging')} onNavigate={go} />
            <button className="dash-user" title={user.name} onClick={onOpenProfile}><span className="dash-avatar">{user.avatar ? <img src={user.avatar} alt="" /> : user.initial}</span><span className="dash-user-name">{user.name.split(' ')[0]}</span></button>
          </div>
        </header>
        <main className={`dash-content${activeKey === 'learning' ? ' learning-hub-content' : ''}`}>{children}</main>
      </div>
    </div>
  );
}

/* ============================================================
   Dashboard home content
   ============================================================ */

const NOTSURE_CARDS = [
  { q: 'Want to learn?', a: 'Explore courses and resources.', l: 'Go to Learning', nav: 'learning' },
  { q: 'Want to see projects in the pipeline?', a: 'Browse projects in Portfolio.', l: 'Go to Portfolio', nav: 'pipeline' },
  { q: 'Want to ask questions or share ideas?', a: 'Join the conversation in Forum.', l: 'Go to Forum', nav: 'community' },
  { q: 'Want to find upcoming events?', a: 'See office hours and events.', l: 'Go to Office Hours & Events', nav: 'events' },
  { q: 'Have a project?', a: 'Share it with the Tribes Capital team.', l: 'Go to Submit Your Project', nav: 'submit-project' },
];

function DashboardHomeContent({ onGo }) {
  return (
    <>
      <div className="dash-banner restored-homepage-hero" role="img" aria-label="Welcome to the Tribes Capital community: learn, connect, participate and take action.">
        <img src={homepageHeroImage} alt="" />
      </div>
      <div className="dash-notsure">
        <h3>Not sure where to start?</h3>
        <p>Tell us what you want to achieve and we'll point you to the right place.</p>
        <div className="dash-notsure-grid">
          {NOTSURE_CARDS.map((c) => (
            <button type="button" className="dash-mini-card" key={c.q} onClick={() => onGo(c.nav)}>
              <span className="q">{c.q}</span>
              <span className="a">{c.a}</span>
              <span className="l">{c.l} <ArrowRight size={12} color="#7C3AED" /></span>
            </button>
          ))}
        </div>
      </div>

      <section className="dash-contact" aria-labelledby="dash-contact-title">
        <div><h3 id="dash-contact-title">Contact Tribes Capital</h3><p>Questions about the community or your project?</p></div>
        <a href="mailto:hello@tribes.capital"><Mail size={17} />hello@tribes.capital</a>
      </section>
    </>
  );
}

function SubmitYourProjectPage() {
  const [project, setProject] = useState({ name: '', type: '', location: '', capacity: '', overview: '', contact: '' });
  const update = (field) => (event) => setProject((current) => ({ ...current, [field]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Project submission: ${project.name.trim()}`);
    const body = encodeURIComponent([
      `Project name: ${project.name.trim()}`,
      `Project type: ${project.type || 'Not specified'}`,
      `Location: ${project.location.trim() || 'Not specified'}`,
      `Capacity (kWp): ${project.capacity || 'Not specified'}`,
      `Contact email: ${project.contact.trim() || 'Not specified'}`,
      '',
      'Project overview:',
      project.overview.trim(),
    ].join('\n'));
    window.location.href = `mailto:hello@tribes.capital?subject=${subject}&body=${body}`;
  };

  return (
    <div className="submit-project-page">
      <header className="submit-project-heading">
        <span>TRIBES CAPITAL</span>
        <h1>Submit Your Project</h1>
        <p>Tell us about your clean energy project. Review the prepared email and send it from your email app.</p>
      </header>
      <form className="submit-project-form" onSubmit={submit}>
        <label>Project name<input required value={project.name} onChange={update('name')} placeholder="e.g. Community solar in Accra" /></label>
        <div className="submit-project-row">
          <label>Project type<select value={project.type} onChange={update('type')}><option value="">Select a type</option><option>Solar</option><option>Mini-grid</option><option>Wind</option><option>Hydro</option><option>Battery storage</option><option>Other</option></select></label>
          <label>Location<input value={project.location} onChange={update('location')} placeholder="City, country" /></label>
        </div>
        <div className="submit-project-row">
          <label>Capacity (kWp)<input type="number" min="0" step="any" value={project.capacity} onChange={update('capacity')} placeholder="Optional" /></label>
          <label>Your contact email<input type="email" value={project.contact} onChange={update('contact')} placeholder="you@example.com" /></label>
        </div>
        <label>Project overview<textarea required rows="5" value={project.overview} onChange={update('overview')} placeholder="Describe the project, its current stage, and the support you are looking for." /></label>
        <div className="submit-project-actions"><p>Submitting opens an email addressed to hello@tribes.capital.</p><button type="submit">Continue to email <ArrowRight size={16} /></button></div>
      </form>
    </div>
  );
}

/* ---------- Contractors ---------- */
const SVC = { all: "All services", solar: "Solar Installation", infrastructure: "Energy Infrastructure", electrical: "Electrical Contractor", advisory: "Energy Advisory", sustainability: "Sustainable Development" };
const CONTRACTOR_SERVICE_OPTIONS = Object.values(SVC).filter((service) => service !== SVC.all);
const CONTRACTOR_PAGE_SIZE = 24;
const toContractorProfile = (profile) => ({
  ...profile,
  n: profile.businessName,
  userId: profile.user?.id || profile.userId,
  v: profile.isVerified,
  r: Number(profile.averageRating || 0),
  rv: profile.reviewCount || 0,
  c: '#5B21B6',
  d: profile.description,
  t: profile.services || [],
  ce: profile.certifications || [],
  tm: profile.teamSize || 'Not provided',
  reviews: profile.reviews || [],
});
function ContractorProfilePage({ pc, onBack, onContact, onMessage, onReview, backLabel = "Back to Contractor Directory" }) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const submitReview = async () => {
    if (reviewText.trim().length < 3) {
      setReviewError('Write a short review before submitting.');
      return;
    }
    setReviewLoading(true);
    try {
      await onReview({ rating, content: reviewText.trim() });
      setReviewText('');
      setReviewError('');
    } catch (error) {
      setReviewError(error.response?.data?.message || error.message || 'Unable to submit your review.');
    } finally {
      setReviewLoading(false);
    }
  };
  return (
    <div className="cp">
      <button className="cp-back" onClick={onBack}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>{backLabel}</button>
      <div className="cp-lay">
        <div className="cp-main">
          <section className="cp-card">
            <div className="cp-head">
              <div className="cp-logo" aria-hidden="true">{pc.n[0]}</div>
              <div className="cp-id">
                <div className="cp-name"><h1>{pc.n}</h1>{pc.v ? <span className="cp-ver"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>Verified</span> : null}</div>
                <p className="cp-role">{pc.t.join(' · ') || 'Clean energy services'}</p>
                <div className="cp-meta">
                  <span><Icon name="mapPin" size={12} />{pc.location || 'Location not provided'}</span>
                  <span className="rt">{pc.rv ? `${pc.r.toFixed(1)} (${pc.rv} reviews)` : 'No reviews yet'}</span>
                  <span>Listed {new Date(pc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="cp-acts">
                <button className="cp-btn line" onClick={onMessage}>Message</button>
                <button className="cp-btn fill" onClick={onContact}>Contact</button>
              </div>
            </div>
          </section>
          <section className="cp-card cp-about"><h3>About</h3><p>{pc.description}</p></section>
          <section className="cp-card"><h3>Services</h3><div className="cp-chips">{pc.t.map(x => <span className="cp-chip" key={x}>{x}</span>)}</div></section>
          <section className="cp-card"><h3>Certifications</h3>{pc.ce.length ? <div className="cp-chips">{pc.ce.map(x => <span className="cp-chip" key={x}>{x}</span>)}</div> : <p className="sub">No certifications listed.</p>}</section>
          <section className="cp-card"><h3>Reviews ({pc.rv})</h3>{pc.reviews.length ? pc.reviews.map((review) => <article className="cp-review" key={review.id}><b>{[review.author?.firstName, review.author?.lastName].filter(Boolean).join(' ') || 'Member'} · {review.rating}/5</b><p>{review.content || 'Rating submitted.'}</p></article>) : <p className="sub">No reviews yet.</p>}
            <div className="lb-field"><label className="lb-label" htmlFor="contractor-review-rating">Your rating</label><select id="contractor-review-rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></div>
            <div className="lb-field"><label className="lb-label" htmlFor="contractor-review-text">Review</label><textarea id="contractor-review-text" className="lb-control" value={reviewText} onChange={(event) => setReviewText(event.target.value)} maxLength={2000} /></div>
            {reviewError && <p role="alert" className="lb-msg">{reviewError}</p>}
            <button className="btn bp" disabled={reviewLoading} onClick={() => void submitReview()}>{reviewLoading ? 'Submitting…' : 'Submit review'}</button>
          </section>
        </div>
        <aside className="cp-rail">
          <section className="cp-card">
            <h3>Business information</h3>
            <button className="cp-btn fill full" onClick={onContact}>Contact contractor</button>
            <button className="cp-btn line full" onClick={onMessage}>Send a message</button>
          </section>
          <section className="cp-card"><h3>Business information</h3>
            <div className="cp-info"><div className="cp-row">Founded<b>{pc.foundedYear || 'Not provided'}</b></div><div className="cp-row">Team size<b>{pc.tm}</b></div>{pc.website && <div className="cp-row">Website<b><a href={pc.website} target="_blank" rel="noreferrer">Visit</a></b></div>}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* "List your business" */
function ListBusinessModal({ onClose, onSubmit }) {
  const [v, setV] = useState({ n: "", s: [], e: "", l: "", d: "" });
  const [errs, setErrs] = useState({});
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const menuRef = useRef(null);
  const services = CONTRACTOR_SERVICE_OPTIONS;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (menu) setMenu(false); else onClose(); } };
    const onDown = (e) => { if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [menu, onClose]);

  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined })); };
  const toggleSvc = (o) => set("s", v.s.includes(o) ? v.s.filter((x) => x !== o) : [...v.s, o]);
  const submit = async () => {
    const e = {};
    if (!v.n.trim()) e.n = "Enter your business name";
    if (!v.s.length) e.s = "Choose at least one service";
    if (v.d.trim().length < 10) e.d = "Add at least 10 characters about your business";
    if (v.e.trim() && !/^\S+@\S+\.\S+$/.test(v.e.trim())) e.e = "Enter a valid email address";
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await onSubmit?.(v);
      setSent(true);
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to submit your listing.');
    }
  };

  return (
    <div className="lb-ov list-business-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-modal" role="dialog" aria-modal="true" aria-labelledby="lb-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        {sent ? (
          <div className="lb-done">
            <div className="ic"><Icon name="check" size={24} strokeWidth={2.4} /></div>
            <h3>Application submitted</h3>
            <p>Our team typically reviews new listings within 2 business days.</p>
            <button className="lb-btn lb-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="lb-head"><h2 id="lb-title">List your business</h2><p>Reach verified clean-energy buyers across the Tribes Capital network.</p></div>
            {requestError && <p role="alert" className="lb-msg">{requestError}</p>}
            <div className="lb-body">
              <div className="lb-field">
                <label className="lb-label" htmlFor="lb-n">Business name *</label>
                <input id="lb-n" className={`lb-control${errs.n ? " err" : ""}`} placeholder="e.g Halios solar solution" value={v.n} onChange={(e) => set("n", e.target.value)} />
                {errs.n && <div className="lb-msg">{errs.n}</div>}
              </div>
              <div className="lb-field" ref={menuRef}>
                <div className="lb-label"><span>Services *</span></div>
                <button type="button" className={`lb-control${menu ? " open" : ""}${errs.s ? " err" : ""}`} aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  <span className={`lb-val${v.s.length ? "" : " empty"}`}>{v.s.length ? v.s.join(", ") : "e.g solar"}</span>
                  <Icon name="chevronDown" size={22} strokeWidth={2} color="currentColor" className="lb-chev" />
                </button>
                {menu && (
                  <ul className="lb-menu" role="listbox" aria-multiselectable="true">
                    {services.map((o) => {
                      const on = v.s.includes(o);
                      return <li key={o}><button type="button" role="option" aria-selected={on} className={`lb-opt${on ? " on" : ""}`} onClick={() => toggleSvc(o)}>{o}{on && <Icon name="check" size={16} strokeWidth={2.2} />}</button></li>;
                    })}
                  </ul>
                )}
                {errs.s && <div className="lb-msg">{errs.s}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="lb-e">Contact email</label>
                <input id="lb-e" type="email" className={`lb-control${errs.e ? " err" : ""}`} placeholder="e.g helios@gmail.com" value={v.e} onChange={(e) => set("e", e.target.value)} />
                {errs.e && <div className="lb-msg">{errs.e}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="lb-l">Location</label>
                <input id="lb-l" className="lb-control" placeholder="Lagos" value={v.l} onChange={(e) => set("l", e.target.value)} />
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="lb-d">Short description *</label>
                <textarea id="lb-d" className={`lb-control${errs.d ? " err" : ""}`} placeholder="What does your business do, and who is it for?" value={v.d} onChange={(e) => set("d", e.target.value)} />
                {errs.d && <div className="lb-msg">{errs.d}</div>}
              </div>
            </div>
            <div className="lb-foot">
              <button className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
              <button className="lb-btn lb-submit" onClick={submit}>Submit for review</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Contact contractor modal — matches design "Contractors › Contact" (same shell as List your business) */
function ContactContractorModal({ contractor, onClose, onSubmit, onOpenMessaging }) {
  const [v, setV] = useState({ n: "", e: "", m: "" });
  const [errs, setErrs] = useState({});
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [box, setBox] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector(".dash-sidebar"), tb = document.querySelector(".dash-topbar");
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined })); };
  const submit = async () => {
    const e = {};
    if (!v.n.trim()) e.n = "Enter your full name";
    if (!v.m.trim()) e.m = "Write a short message";
    if (v.e.trim() && !/^\S+@\S+\.\S+$/.test(v.e.trim())) e.e = "Enter a valid email address";
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await onSubmit?.(v);
      setSent(true);
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to send your message.');
    }
  };

  return (
    <div className={`lb-ov ct-ov${sent ? " center" : ""}`} style={{ left: box.left, top: box.top }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`lb-modal ct${sent ? " ok ct-sent" : ""}`} role="dialog" aria-modal="true" aria-labelledby="ct-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        {sent ? (
          <div className="lb-done">
            <div className="sp" aria-hidden="true" />
            <h3 id="ct-title">Message sent</h3>
            <p>{contractor.n} typically replies within 24 hours. Continue the conversation anytime from Messaging.</p>
            <button className="lb-btn lb-cancel wide" onClick={onOpenMessaging}>Open Messaging</button>
            <button className="lb-btn lb-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="lb-head"><h2 id="ct-title">Contact {contractor.n}</h2><p>Typically replies within 24 hours.</p></div>
            {requestError && <p role="alert" className="lb-msg">{requestError}</p>}
            <div className="lb-body">
              <div className="lb-field">
                <label className="lb-label" htmlFor="ct-n">Full name *</label>
                <input id="ct-n" className={`lb-control${errs.n ? " err" : ""}`} placeholder="e.g Halios solar solution" value={v.n} onChange={(e) => set("n", e.target.value)} />
                {errs.n && <div className="lb-msg">{errs.n}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ct-e">Contact email</label>
                <input id="ct-e" type="email" className={`lb-control${errs.e ? " err" : ""}`} placeholder="e.g helios@gmail.com" value={v.e} onChange={(e) => set("e", e.target.value)} />
                {errs.e && <div className="lb-msg">{errs.e}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ct-m">Message *</label>
                <textarea id="ct-m" className={`lb-control${errs.m ? " err" : ""}`} placeholder="What does your business do, and who is it for?" value={v.m} onChange={(e) => set("m", e.target.value)} />
                {errs.m && <div className="lb-msg">{errs.m}</div>}
              </div>
            </div>
            <div className="lb-foot">
              <button className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
              <button className="lb-btn lb-submit" onClick={() => void submit()}>Send message</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Contractors({ initQ, go, initProf = null, fromEvent = null }) {
  const [q, setQ] = useState(initQ || ''), [svc, setSvc] = useState('all'), [loc, setLoc] = useState('all'), [sort, setSort] = useState('verified');
  const [profiles, setProfiles] = useState([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [prof, setProf] = useState(initProf), [selectedProfile, setSelectedProfile] = useState(null), [profileLoading, setProfileLoading] = useState(false);
  const [contact, setContact] = useState(null), [biz, setBiz] = useState(false), [refresh, setRefresh] = useState(0), [page, setPage] = useState(1);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    marketplaceAPI.listContractors({
      search: q.trim() || undefined,
      service: svc === 'all' ? undefined : svc,
      location: loc === 'all' ? undefined : loc,
      skip: (page - 1) * CONTRACTOR_PAGE_SIZE,
      take: CONTRACTOR_PAGE_SIZE,
    })
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? {};
        const items = Array.isArray(payload) ? payload : payload.data || [];
        if (isCurrent) {
          setProfiles(items.map(toContractorProfile));
          setTotal(payload.total ?? items.length);
          setError('');
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load contractors.');
      })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, [q, svc, loc, page, refresh]);

  useEffect(() => {
    if (!prof) { setSelectedProfile(null); return undefined; }
    let isCurrent = true;
    setProfileLoading(true);
    marketplaceAPI.getContractor(prof)
      .then((response) => {
        if (isCurrent) setSelectedProfile(toContractorProfile(response?.data?.data ?? response?.data));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load this contractor.');
      })
      .finally(() => { if (isCurrent) setProfileLoading(false); });
    return () => { isCurrent = false; };
  }, [prof]);

  const serviceOptions = [...new Set(profiles.flatMap((profile) => profile.services))].sort();
  const locationOptions = [...new Set(profiles.map((profile) => profile.location).filter(Boolean))].sort();
  let list = profiles.filter((profile) => (svc === 'all' || profile.services.includes(svc)) && (loc === 'all' || profile.location === loc));
  list = [...list].sort((a, b) => sort === 'name' ? a.n.localeCompare(b.n) : sort === 'rating' ? b.r - a.r : sort === 'reviews' ? b.rv - a.rv : sort === 'verified' ? Number(b.v) - Number(a.v) || b.r - a.r : Number(b.v) - Number(a.v));
  const filtered = !!q || svc !== 'all' || loc !== 'all';
  const clear = () => { setPage(1); setQ(''); setSvc('all'); setLoc('all'); };
  const pageCount = Math.max(1, Math.ceil(total / CONTRACTOR_PAGE_SIZE));
  const pc = selectedProfile || profiles.find((profile) => profile.id === prof);
  const select = (value, setValue, options, allLabel) => <select value={value} onChange={(event) => { setPage(1); setValue(event.target.value); }}><option value="all">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;

  const sendMessage = async (values, contractor) => {
    if (!contractor.userId) throw new Error('This listing is not linked to a messaging account yet.');
    const response = await messagingAPI.createConversation({ type: 'DIRECT', participantIds: [contractor.userId], title: contractor.n });
    const conversation = response?.data?.data ?? response?.data;
    if (!conversation?.id) throw new Error('Could not start a conversation with this contractor.');
    await messagingAPI.sendMessage(conversation.id, { content: values.m.trim() });
  };

  if (prof) {
    if (profileLoading || !pc) return <div role="status" className="sub">Loading contractor profile…</div>;
    return <>
      <ContractorProfilePage
        pc={pc}
        onBack={() => { setProf(null); if (fromEvent) fromEvent.onBack(); }}
        backLabel={fromEvent?.label}
        onContact={() => setContact(pc)}
        onMessage={() => go('messaging')}
        onReview={async (review) => {
          await marketplaceAPI.addContractorReview(pc.id, review);
          const response = await marketplaceAPI.getContractor(pc.id);
          setSelectedProfile(toContractorProfile(response?.data?.data ?? response?.data));
        }}
      />
      {contact && <ContactContractorModal key={contact.id} contractor={contact} onClose={() => setContact(null)} onSubmit={(values) => sendMessage(values, contact)} onOpenMessaging={() => { setContact(null); go('messaging'); }} />}
    </>;
  }

  return <>
    <div className="ph"><div><h1>Contractor Directory</h1><p>Find clean-energy and energy professionals for your project.</p></div><button className="btn bp" onClick={() => setBiz(true)}>List your business</button></div>
    <div className="tool"><input placeholder="Search by business or service…" value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} />
      {select(svc, setSvc, serviceOptions, 'All services')}{select(loc, setLoc, locationOptions, 'All locations')}{select(sort, setSort, ['verified', 'rating', 'reviews', 'name'], 'Sort: Verified first')}</div>
    <div className="row wrap sub" style={{ marginBottom: 16 }}><span><b style={{ color: 'var(--i9)' }}>{total}</b> contractors</span>{error && <span role="alert">{error}</span>}{(q || svc !== 'all' || loc !== 'all') && <button className="lk" onClick={clear}>Clear filters</button>}</div>
    {loading && <p role="status" className="sub">Loading contractors…</p>}
    <div className="g3">
      {!loading && list.length === 0 && (
        <div className="tca-empty-state-wrap">
          <div className="tca-empty-state-content">
            <img className="tca-empty-state-illustration" src="/illustrations/business-partnership-deal-illustration.svg" alt="No contractors found illustration" />
            <h3>{filtered ? 'No contractors match your filters' : 'No contractor listings yet'}</h3>
            <p>{filtered ? 'Try a different service, location or search term.' : 'List your business to create the first listing.'}</p>
          </div>
        </div>
      )}
      {list.map((contractor) => <div className="card" key={contractor.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="row" style={{ alignItems: 'flex-start', marginBottom: 10 }}><Ava c={contractor.c} t={contractor.n[0]} s={38} />
          <div className="sp"><div className="row" style={{ justifyContent: 'space-between' }}><b style={{ fontSize: 14.5 }}>{contractor.n}</b>{contractor.v && <span className="ver">✓ Verified</span>}</div><div style={{ color: 'var(--p6)', fontSize: 12.5, fontWeight: 600 }}>{contractor.t.join(' · ')}</div></div></div>
        <div className="mut row" style={{ gap: 5, margin: '0 0 10px' }}><Icon name="mapPin" size={13} />{contractor.location || 'Location not provided'}</div>
        <p className="sub sp" style={{ marginBottom: 12 }}>{contractor.d}</p>
        <div className="row wrap" style={{ gap: 6, marginBottom: 14 }}>{contractor.t.map((service) => <span className="tag" key={service}>{service}</span>)}</div>
        <div className="row" style={{ borderTop: '1px solid var(--ln)', paddingTop: 14 }}><button className="btn bo sm sp" onClick={() => { setSelectedProfile(contractor); setProf(contractor.id); }}>View profile</button><button className="btn bp sm sp" onClick={() => setContact(contractor)}>Contact</button></div>
        <div className="mut" style={{ marginTop: 8 }}>{contractor.rv ? `${contractor.r.toFixed(1)} · ${contractor.rv} reviews` : 'No reviews yet'}</div>
      </div>)}
    </div>
    {!loading && pageCount > 1 && <div className="row wrap" style={{ justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
      <span className="sub">Showing {(page - 1) * CONTRACTOR_PAGE_SIZE + 1}–{Math.min(page * CONTRACTOR_PAGE_SIZE, total)} of {total}</span>
      <div className="row" aria-label="Contractor directory pagination">
        <button type="button" className="btn bl sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span className="sub">Page {page} of {pageCount}</span>
        <button type="button" className="btn bl sm" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
      </div>
    </div>}
    {contact && <ContactContractorModal key={contact.id} contractor={contact} onClose={() => setContact(null)} onSubmit={(values) => sendMessage(values, contact)} onOpenMessaging={() => { setContact(null); go('messaging'); }} />}
    {biz && <ListBusinessModal onClose={() => setBiz(false)} onSubmit={async (values) => {
      await marketplaceAPI.saveContractorProfile({ businessName: values.n.trim(), services: values.s, contactEmail: values.e.trim() || undefined, location: values.l.trim() || undefined, description: values.d.trim() });
      setRefresh((current) => current + 1);
    }} />}
  </>;
}

/* ---------- Community ---------- */
const CATS = ["Solar", "Policy & regulation", "Learning", "Energy community", "Batteries & storage", "General"];
const FILTER_PILLS = [
  { key: "All", label: "All discussions" },
  { key: "Following", label: "Following" },
  { key: "Solar", label: "Solar" },
  { key: "Policy", label: "Policy & regulation" },
  { key: "Learning", label: "Learning" },
  { key: "Energy", label: "Energy community" },
];

const longAgo = (w) => (w || "")
  .replace(/^(\d+)m ago$/, (_, n) => `${n} ${n === "1" ? "minute" : "minutes"} ago`)
  .replace(/^(\d+)h ago$/, (_, n) => `${n} ${n === "1" ? "hour" : "hours"} ago`)
  .replace(/^(\d+)d ago$/, (_, n) => `${n} ${n === "1" ? "day" : "days"} ago`);

function DiscussionDetail({ post, user, liked, saved, onBack, onToggleLike, onToggleSave, onToggleCommentLike, onShare, onReply, onOpenRelated }) {
  const [draft, setDraft] = useState("");
  const [replyError, setReplyError] = useState('');
  const inputRef = useRef(null);
  const isLiked = !!liked[post.id];
  const isSaved = !!saved[post.id];
  const submit = async () => {
    if (!draft.trim()) { if (inputRef.current) inputRef.current.focus(); return; }
    try {
      await onReply(post.id, draft.trim());
      setDraft("");
      setReplyError('');
    } catch (error) {
      setReplyError(error.response?.data?.message || error.message || 'Unable to post your reply.');
    }
  };
  const replyTo = (name) => { setDraft(`@${name.split(" ")[0]} `); if (inputRef.current) inputRef.current.focus(); };
  const facts = [["Topic", post.topic], ["Posted", longAgo(post.w)], ["Participants", `${post.participants} members`], ["Views", post.vwFull || post.vw]];
  return (
    <div className="dd">
      <button className="dd-back" onClick={onBack}><Icon name="arrowLeft" size={14} strokeWidth={2} />Back to Community</button>
      <div className="dd-lay">
        <div className="dd-main">
          <article className="dd-card dd-post">
            <div className="dd-head">
              <Ava c={post.c} t={post.n[0]} s={44} />
              <div className="dd-who"><div className="dd-name">{post.n}</div><div className="dd-meta">{post.r} · {post.w}</div></div>
              <span className="dd-tag">{post.tag}</span>
            </div>
            <h2 className="dd-title">{post.t}</h2>
            {post.b.split("\n\n").map((para, i) => <p className="dd-body" key={i}>{para}</p>)}
            <div className="dd-actions">
              <span className="dd-act"><Icon name="message" size={16} />{post.rp} replies</span>
              <button className={`dd-act${isLiked ? " on" : ""}`} onClick={() => onToggleLike(post.id)} aria-pressed={isLiked}>
                <Icon name={isLiked ? "heartFilled" : "heart"} size={16} />{post.lk} likes
              </button>
              <span className="dd-act"><Icon name="eye" size={16} />{post.vw} views</span>
              <button className="dd-act" onClick={() => onShare(post)}><Icon name="share" size={16} />Share</button>
              <button className={`dd-act${isSaved ? " on" : ""}`} onClick={() => onToggleSave(post.id)} aria-pressed={isSaved}>
                <Icon name={isSaved ? "bookmarkFilled" : "bookmark"} size={16} />{isSaved ? "Saved" : "Save"}
              </button>
            </div>
          </article>

          <div className="dd-card dd-composer">
            <Ava c="#2457C5" t={user.initial} s={40} />
            <input ref={inputRef} className="dd-input" placeholder="Write a reply…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void submit()} aria-label="Write a reply" />
            <button className="dd-send" onClick={() => void submit()}>Post reply</button>
          </div>
          {replyError && <p role="alert" className="sub">{replyError}</p>}

          <div className="dd-rhead"><b>{post.rp} replies</b><span>Sorted by: Top</span></div>
          {(post.replies || []).map((rp) => {
            const rl = rp.userVote === 1;
            return (
              <div className={`dd-card dd-reply${rp.best ? " best" : ""}`} key={rp.id}>
                <div className="dd-head">
                  <Ava c={rp.c} t={rp.n[0]} s={40} />
                  <div className="dd-who">
                    <div className="dd-name">{rp.n}{rp.verified && <span className="dd-pill"><Icon name="check" size={12} strokeWidth={2.2} />Verified</span>}</div>
                    <div className="dd-meta">{rp.r} · {rp.w}</div>
                  </div>
                  {rp.best && <span className="dd-pill badge"><Icon name="starFilled" size={12} />Best answer</span>}
                </div>
                <p className="dd-reply-body">{rp.body}</p>
                <div className="dd-reply-foot">
                  <button className={`dd-like${rl ? " on" : ""}`} onClick={() => onToggleCommentLike(post.id, rp.id)} aria-pressed={rl}>
                    <Icon name={rl ? "heartFilled" : "heart"} size={16} />{rp.lk} likes
                  </button>
                  <button className="dd-link" onClick={() => replyTo(rp.n)}>Reply</button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="dd-rail">
          <div className="dd-card dd-side">
            <h4>About this discussion</h4>
            {facts.map(([a, b]) => <div key={a} className="dd-fact"><span>{a}</span><b>{b}</b></div>)}
          </div>
          <div className="dd-card dd-side">
            <h4>Related discussions</h4>
            {(post.related || []).map((rl) => (
              <button key={rl.t} className="dd-rel" onClick={() => onOpenRelated(rl.t)}><b>{rl.t}</b><span>{rl.rp} replies</span></button>
            ))}
          </div>
          <div className="dd-card dd-side dd-tip">
            <h4>Keep it helpful</h4>
            <p>Share real experience and stay respectful. Great answers help the whole community take action.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AskQuestionModal({ categories, onClose, onSubmit }) {
  const [v, setV] = useState({ c: "", q: "", b: "" });
  const [errs, setErrs] = useState({});
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [box, setBox] = useState({ left: 0, top: 0 });
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector(".dash-sidebar"), tb = document.querySelector(".dash-topbar");
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (menu) setMenu(false); else onClose(); } };
    const onDown = (e) => { if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [menu, onClose]);

  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined })); };
  const submit = async () => {
    const e = {};
    if (!v.c) e.c = "Choose a category";
    if (!v.q.trim()) e.q = "Enter your question";
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await onSubmit?.({ ...v, q: v.q.trim(), b: v.b.trim() });
      setSent(true);
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to post your question.');
    }
  };

  return (
    <div className="lb-ov center disc-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-modal ask" role="dialog" aria-modal="true" aria-labelledby="ask-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        {sent ? (
          <div className="lb-done">
            <div className="ic"><Icon name="check" size={24} strokeWidth={2.4} /></div>
            <h3>Question posted</h3>
            <p>Your question is now live in Community. We'll notify you when someone replies.</p>
            <button className="lb-btn lb-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="lb-head"><h2 id="ask-title">Ask a question</h2><p>Get input from other members across the energy community.</p></div>
            {requestError && <p role="alert" className="lb-msg">{requestError}</p>}
            <div className="lb-body">
              <div className="lb-field" ref={menuRef}>
                <div className="lb-label"><span>Category *</span></div>
                <button type="button" className={`lb-control${menu ? " open" : ""}${errs.c ? " err" : ""}`} aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  <span className={`lb-val${v.c ? "" : " empty"}`}>{v.c || "e.g solar"}</span>
                  <Icon name="chevronDown" size={22} strokeWidth={2} color="currentColor" className="lb-chev" />
                </button>
                {menu && (
                  <ul className="lb-menu" role="listbox">
                    {categories.map((o) => {
                      const on = v.c === o;
                      return <li key={o}><button type="button" role="option" aria-selected={on} className={`lb-opt${on ? " on" : ""}`} onClick={() => { set("c", o); setMenu(false); }}>{o}{on && <Icon name="check" size={16} strokeWidth={2.2} />}</button></li>;
                    })}
                  </ul>
                )}
                {errs.c && <div className="lb-msg">{errs.c}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ask-q">Your question</label>
                <input id="ask-q" className={`lb-control${errs.q ? " err" : ""}`} placeholder="e.g helios@gmail.com" value={v.q} onChange={(e) => set("q", e.target.value)} />
                {errs.q && <div className="lb-msg">{errs.q}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ask-b">Add detail (optional)</label>
                <textarea id="ask-b" className="lb-control" placeholder="What does your business do, and who is it for?" value={v.b} onChange={(e) => set("b", e.target.value)} />
              </div>
            </div>
            <div className="lb-foot">
              <button type="button" className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
              <button type="button" className="lb-btn lb-submit" onClick={submit}>Post question</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StartDiscussionModal({ categories, onClose, onSubmit }) {
  const [v, setV] = useState({ t: "", c: "", b: "", tags: "" });
  const [errs, setErrs] = useState({});
  const [menu, setMenu] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [box, setBox] = useState({ left: 0, top: 0 });
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector(".dash-sidebar"), tb = document.querySelector(".dash-topbar");
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (menu) setMenu(false); else onClose(); } };
    const onDown = (e) => { if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [menu, onClose]);

  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined })); };
  const submit = async () => {
    const e = {};
    if (!v.t.trim()) e.t = "Give your discussion a title";
    if (!v.c) e.c = "Choose a category";
    if (!v.b.trim()) e.b = "Write something to start the discussion";
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await onSubmit?.({ ...v, t: v.t.trim(), b: v.b.trim(), tags: v.tags.split(",").map((x) => x.trim()).filter(Boolean) });
      setSent(true);
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to start this discussion.');
    }
  };

  return (
    <div className="lb-ov center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-modal ask disc" role="dialog" aria-modal="true" aria-labelledby="disc-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        {sent ? (
          <div className="lb-done">
            <div className="ic"><Icon name="check" size={24} strokeWidth={2.4} /></div>
            <h3>Discussion posted</h3>
            <p>Members can start replying right away.</p>
            <button className="lb-btn lb-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="lb-head"><h2 id="disc-title">Start a discussion</h2><p>Share knowledge, a resource, or start a conversation with the community.</p></div>
            {requestError && <p role="alert" className="lb-msg">{requestError}</p>}
            <div className="lb-body">
              <div className="lb-field">
                <label className="lb-label" htmlFor="disc-t">Title</label>
                <input id="disc-t" className={`lb-control${errs.t ? " err" : ""}`} placeholder="e.g. How can mini-grids scale sustainably?" value={v.t} onChange={(e) => set("t", e.target.value)} />
                {errs.t && <div className="lb-msg">{errs.t}</div>}
              </div>
              <div className="lb-field" ref={menuRef}>
                <div className="lb-label"><span>Category *</span></div>
                <button type="button" className={`lb-control${menu ? " open" : ""}${errs.c ? " err" : ""}`} aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  <span className={`lb-val${v.c ? "" : " empty"}`}>{v.c || "e.g solar"}</span>
                  <Icon name="chevronDown" size={22} strokeWidth={2} color="currentColor" className="lb-chev" />
                </button>
                {menu && (
                  <ul className="lb-menu" role="listbox">
                    {categories.map((o) => {
                      const on = v.c === o;
                      return <li key={o}><button type="button" role="option" aria-selected={on} className={`lb-opt${on ? " on" : ""}`} onClick={() => { set("c", o); setMenu(false); }}>{o}{on && <Icon name="check" size={16} strokeWidth={2.2} />}</button></li>;
                    })}
                  </ul>
                )}
                {errs.c && <div className="lb-msg">{errs.c}</div>}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="disc-b">Discussion</label>
                <textarea id="disc-b" className={`lb-control${errs.b ? " err" : ""}`} placeholder="Share your perspective, experience, or question with the community." value={v.b} onChange={(e) => set("b", e.target.value)} />
                {errs.b && <div className="lb-msg">{errs.b}</div>}
              </div>
              <div className="lb-field">
                <div className="lb-label"><label htmlFor="disc-tags">Tags (optional)</label><em>Separate tags with commas.</em></div>
                <input id="disc-tags" className="lb-control" placeholder="e.g. solar, mini-grid, financing" value={v.tags} onChange={(e) => set("tags", e.target.value)} />
              </div>
            </div>
            <div className="lb-foot">
              <button type="button" className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
              <button type="button" className="lb-btn lb-submit" onClick={submit}>Post discussion</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const communityRelativeTime = (value) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const toCommunityComment = (comment) => ({
  ...comment,
  c: '#5B21B6',
  n: [comment.creator?.firstName, comment.creator?.lastName].filter(Boolean).join(' ') || 'Member',
  r: comment.creator?.occupation || 'Member',
  w: communityRelativeTime(comment.createdAt),
  body: comment.content,
  lk: comment.upvotes || 0,
  best: false,
});

const toCommunityPost = (post) => {
  const author = post.creator || {};
  return {
    ...post,
    c: '#5B21B6',
    n: [author.firstName, author.lastName].filter(Boolean).join(' ') || 'Member',
    r: [author.occupation || 'Member', author.address].filter(Boolean).join(' · '),
    w: communityRelativeTime(post.createdAt),
    tag: post.category || 'General',
    topic: post.category || 'General',
    t: post.title,
    b: post.content,
    rp: post.commentsCount || 0,
    lk: post.upvotes || 0,
    vw: String(post.viewCount || 0),
    vwFull: String(post.viewCount || 0),
    followedByMe: Boolean(author.isFollowedByMe),
    replies: Array.isArray(post.comments) ? post.comments.map(toCommunityComment) : [],
    related: [],
  };
};

function Community({ open, user, toast, onOpenMessaging }) {
  const [posts, setPosts] = useState([]), [members, setMembers] = useState([]);
  const [f, setF] = useState('All'), [m, setM] = useState(open || null);
  const [liked, setLiked] = useState({}), [saved, setSaved] = useState({});
  const [detailId, setDetailId] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    Promise.allSettled([
      communityAPI.listPosts({ take: 100 }),
      communityAPI.listMembers({ take: 5 }),
    ]).then(([postsResult, membersResult]) => {
      if (!isCurrent) return;
      if (postsResult.status === 'fulfilled') {
        const payload = postsResult.value?.data?.data ?? postsResult.value?.data ?? {};
        const items = Array.isArray(payload) ? payload : payload.data || [];
        const nextPosts = items.map(toCommunityPost);
        setPosts(nextPosts);
        setLiked(Object.fromEntries(nextPosts.filter((post) => post.userVote === 1).map((post) => [post.id, true])));
        setSaved(Object.fromEntries(nextPosts.filter((post) => post.savedByMe).map((post) => [post.id, true])));
      } else {
        setError(postsResult.reason.response?.data?.message || 'Unable to load community discussions.');
      }
      if (membersResult.status === 'fulfilled') {
        const payload = membersResult.value?.data?.data ?? membersResult.value?.data ?? [];
        setMembers(Array.isArray(payload) ? payload : payload.data || []);
      }
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, []);

  const categoryByFilter = { Solar: 'Solar', Policy: 'Policy & regulation', Learning: 'Learning', Energy: 'Energy community' };
  const shown = f === 'Following'
    ? posts.filter((post) => post.followedByMe)
    : posts.filter((post) => f === 'All' || post.tag === (categoryByFilter[f] || f));
  const close = () => setM(null);
  const current = posts.find((p) => p.id === detailId);

  const add = async (values) => {
    const title = values.t || values.q;
    const content = values.b?.trim() || title;
    const response = await communityAPI.createPost({ title, content, category: values.c || 'General', tags: values.tags || [] });
    const post = toCommunityPost(response?.data?.data ?? response?.data);
    setPosts((items) => [post, ...items]);
  };
  const openPost = async (id) => {
    setDetailId(id);
    try {
      const response = await communityAPI.getPost(id);
      const post = toCommunityPost(response?.data?.data ?? response?.data);
      setPosts((items) => items.map((item) => item.id === id ? post : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load this discussion.');
    }
  };
  const toggleLike = async (id) => {
    try {
      const response = await communityAPI.togglePostVote(id);
      const result = response?.data?.data ?? response?.data ?? {};
      setLiked((items) => ({ ...items, [id]: result.userVote === 1 }));
      setPosts((items) => items.map((post) => post.id === id ? { ...post, lk: result.upvotes, userVote: result.userVote } : post));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this vote.');
    }
  };
  const toggleSave = async (id) => {
    try {
      const response = await communityAPI.toggleSave(id);
      const result = response?.data?.data ?? response?.data ?? {};
      setSaved((items) => ({ ...items, [id]: result.saved }));
      setPosts((items) => items.map((post) => post.id === id ? { ...post, savedByMe: result.saved } : post));
      toast?.(result.saved ? 'Saved to your list' : 'Removed from saved');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save this discussion.');
    }
  };
  const toggleFollow = async (member) => {
    try {
      const response = await communityAPI.toggleFollow(member.id);
      const result = response?.data?.data ?? response?.data ?? {};
      setMembers((items) => items.map((item) => item.id === member.id ? { ...item, isFollowedByMe: result.following } : item));
      setPosts((items) => items.map((post) => post.creator?.id === member.id ? { ...post, followedByMe: result.following } : post));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this follow.');
    }
  };
  const postReply = async (id, content) => {
    try {
      const response = await communityAPI.addComment(id, { content });
      const reply = toCommunityComment(response?.data?.data ?? response?.data);
      setPosts((items) => items.map((post) => post.id === id ? { ...post, rp: post.rp + 1, replies: [...post.replies, reply] } : post));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to post your reply.');
      throw requestError;
    }
  };
  const toggleCommentLike = async (postId, commentId) => {
    try {
      const response = await communityAPI.toggleCommentVote(commentId);
      const result = response?.data?.data ?? response?.data ?? {};
      setPosts((items) => items.map((post) => post.id === postId ? {
        ...post,
        replies: post.replies.map((reply) => reply.id === commentId ? { ...reply, lk: result.upvotes, userVote: result.userVote } : reply),
      } : post));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this reply vote.');
    }
  };
  const shareDiscussion = (post) => {
    try { navigator.clipboard?.writeText(`${window.location.origin}/community/${post.id}`); } catch (e) { /* Clipboard may be unavailable. */ }
    toast?.('Link copied to clipboard');
  };
  const openRelated = (title) => { const found = posts.find((post) => post.t === title); if (found) void openPost(found.id); };

  if (current) {
    return <DiscussionDetail post={current} user={user} liked={liked} saved={saved} onBack={() => setDetailId(null)} onToggleLike={toggleLike} onToggleSave={toggleSave} onToggleCommentLike={toggleCommentLike} onShare={shareDiscussion} onReply={postReply} onOpenRelated={openRelated} />;
  }

  const popularTopics = posts.reduce((counts, post) => ({ ...counts, [post.tag]: (counts[post.tag] || 0) + 1 }), {});
  return <>
    <section className="forum-hero" aria-labelledby="forum-title">
      <div className="forum-hero-copy">
        <p className="forum-hero-eyebrow">TRIBES CAPITAL / MEMBER FORUM</p>
        <h1 id="forum-title">Ideas and experience for a stronger energy sector.</h1>
        <p>Ask thoughtful questions, share what you have learned, and connect with people working across clean energy.</p>
        <div className="forum-hero-actions">
          <button className="btn bo" onClick={() => setM("ask")}>Ask a question</button>
          <button className="btn forum-messaging-action" onClick={() => setM("start")}>Start a discussion</button>
          {user?.accountType !== 'GUEST' && <button className="btn forum-messaging-action" onClick={onOpenMessaging}>Messaging</button>}
        </div>
      </div>
      <aside className="forum-visual" aria-label="Forum topics">
        <div className="forum-visual-heading"><span>What brings us together</span><span className="forum-live-tag">Community</span></div>
        <div className="forum-visual-row"><span className="forum-visual-index">01</span><div><strong>Learn</strong><small>Trade practical knowledge and insight</small></div></div>
        <div className="forum-visual-row"><span className="forum-visual-index">02</span><div><strong>Connect</strong><small>Meet peers across the energy sector</small></div></div>
        <div className="forum-visual-row"><span className="forum-visual-index">03</span><div><strong>Build</strong><small>Turn good conversations into action</small></div></div>
        <div className="forum-visual-foot"><span><strong>{posts.length}</strong> discussions</span><span><strong>{Object.keys(popularTopics).length}</strong> active topics</span></div>
      </aside>
    </section>
    {error && <p role="alert" className="sub">{error}</p>}
    <div className="pills forum-filters"><span className="forum-filter-label">Browse discussions by topic</span>{FILTER_PILLS.map((x) => <button key={x.key} className={"pl" + (f === x.key ? " on" : "")} onClick={() => setF(x.key)}>{x.label}</button>)}</div>
    <div className="lay"><div className="sp forum-post-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div role="status" className="card sub forum-empty-state">Loading discussions…</div>}
      {!loading && shown.length === 0 && <div className="card forum-empty-state"><span className="forum-empty-icon"><Icon name="message" size={26} color="#5B21B6" /></span><strong>{f === "Following" ? "Your followed conversations will appear here" : "The next good conversation starts here"}</strong><p className="sub">{f === "Following" ? "Follow members whose ideas you want to keep up with." : "Share a question or perspective with the community."}</p></div>}
      {shown.map((p) => <div className="card forum-post" key={p.id}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}><div className="row"><Ava c={p.c} t={p.n[0]} /><div><b style={{ fontSize: 13.5 }}>{p.n} <span className="mut" style={{ fontWeight: 400 }}>· {p.w}</span></b><div className="mut">{p.r}</div></div></div><span className="tp">{p.tag}</span></div>
        <button className="disc-title-btn" onClick={() => void openPost(p.id)}><h3 style={{ fontSize: 15, marginBottom: 8 }}>{p.t}</h3></button>
        <p className="sub" style={{ marginBottom: 14 }}>{p.b.split("\n\n")[0]}</p>
        <div className="row wrap" style={{ justifyContent: "space-between", gap: 14 }}>
          <div className="row wrap mut" style={{ gap: 18 }}><span className="row" style={{ gap: 6 }}><Icon name="message" size={16} />{p.rp} replies</span><button className="lk" style={{ color: liked[p.id] ? "var(--p7)" : "var(--i4)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => void toggleLike(p.id)}><Icon name={liked[p.id] ? "heartFilled" : "heart"} size={16} />{p.lk} likes</button><span className="row" style={{ gap: 6 }}><Icon name="eye" size={16} />{p.vw} views</span></div>
          <button className="lk" onClick={() => void openPost(p.id)}>Join discussion →</button>
        </div>
      </div>)}
    </div>
      <div className="rail forum-rail">
        <div className="card forum-topic-panel"><h4 style={{ marginBottom: 12, fontSize: 14 }}>Popular topics</h4>{Object.entries(popularTopics).map(([topic, count]) => <div key={topic} className="row forum-topic-row" style={{ justifyContent: "space-between", fontSize: 13 }}><span className="row" style={{ color: "var(--p9)", fontWeight: 600 }}><i className="forum-topic-swatch" aria-hidden="true" />{topic}</span><span className="mut">{count} posts</span></div>)}</div>
        <div className="card forum-member-panel"><h4 style={{ marginBottom: 14, fontSize: 14 }}>Active members</h4>{members.map((member) => { const name = [member.firstName, member.lastName].filter(Boolean).join(' ') || 'Member'; return <div key={member.id} className="row" style={{ marginBottom: 14 }}><Ava c="#5B21B6" t={name[0]} s={32} /><div className="sp"><b style={{ fontSize: 13 }}>{name}</b><div className="mut">{member.occupation || 'Community member'}</div></div><button className="btn sm" style={{ background: member.isFollowedByMe ? "var(--bg)" : "var(--p0)", color: member.isFollowedByMe ? "var(--i4)" : "var(--p7)", borderRadius: 999 }} onClick={() => void toggleFollow(member)}>{member.isFollowedByMe ? "Following" : "Follow"}</button></div>; })}</div>
        <div className="card"><h4 style={{ color: "var(--p9)", marginBottom: 8, fontSize: 14 }}>Community guidelines</h4><p className="sub" style={{ marginBottom: 10 }}>Be respectful, stay on topic and share knowledge that helps others learn and take action.</p><button className="lk" onClick={() => setM("guide")}>Read the guidelines →</button></div>
      </div></div>
    {m === "ask" && <AskQuestionModal categories={CATS} onClose={close} onSubmit={(v) => add(v)} />}
    {m === "start" && <StartDiscussionModal categories={CATS} onClose={close} onSubmit={add} />}
    {m === "guide" && <Modal onClose={close} w={560}><h2>Community guidelines</h2><p className="sub" style={{ marginBottom: 16 }}>A few simple principles that keep this community useful for everyone.</p>
      {[["Be respectful", "Disagree with ideas, not people."], ["Stay on topic", "Post in the category that best fits."], ["Share real experience", "Back up claims with experience, data or credible sources."], ["No spam or unsolicited promotion", "Sales pitches belong in Contact, not Community."], ["Protect privacy", "Don't share personal contact details or confidential project information."], ["Report, don't retaliate", "Flag content that breaks these guidelines."]].map(([a, b], i) => <div className="row" key={a} style={{ alignItems: "flex-start", marginBottom: 14 }}><div className="ava" style={{ background: "var(--p1)", color: "var(--p7)", width: 26, height: 26, borderRadius: 8, fontSize: 12.5 }}>{i + 1}</div><div><b style={{ fontSize: 13.5 }}>{a}</b><p className="sub">{b}</p></div></div>)}
      <button className="btn bp blk" onClick={close}>Got it</button></Modal>}
  </>;
}

/* ---------- Vault ---------- */
/* ---------- Pipeline ---------- */
const STG = [["scoping", "Scoping", "#9CA3AF"], ["due-diligence", "Due diligence", "#F59E0B"], ["development", "Development", "#7C3AED"], ["operational", "Operational", "#10B981"]];
const TYC = { Solar: ["#FEF3C7", "#B45309"], "Mini-grid": ["#DBEAFE", "#1D4ED8"], Storage: ["#CCFBF1", "#0F766E"], Wind: ["#E0E7FF", "#4338CA"], Hydro: ["#CFFAFE", "#0E7490"] };
const toBoardProject = (project) => {
  const projectStatus = project.status === 'planning' ? 'scoping' : project.status;
  const stageIndex = STG.findIndex(([status]) => status === projectStatus);
  return {
    ...project,
    n: project.title,
    t: project.projectType || 'Project',
    s: stageIndex < 0 ? 0 : stageIndex,
    l: project.location || 'Location not specified',
    c: Number(project.capacityKwp || 0),
    k: project.managingContractor || 'Unassigned',
    w: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '',
  };
};
const Ty = ({ t }) => { const colors = TYC[t] || ["#F3F4F6", "#4B5563"]; return <span className="tag" style={{ background: colors[0], color: colors[1], fontWeight: 600, fontSize: 11 }}>{t}</span>; };
/* "Add project" — built to the design; same content-area overlay as the other modals */
function AddProjectModal({ types, stages, onClose, onSubmit }) {
  const [v, setV] = useState({ n: "", t: "", s: "", l: "", c: "", k: "", x: "" });
  const [errs, setErrs] = useState({});
  const [menu, setMenu] = useState(null);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [box, setBox] = useState({ left: 0, top: 0 });
  const CAP = ["50", "100", "150", "250", "500", "1000"];

  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector(".dash-sidebar"), tb = document.querySelector(".dash-topbar");
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (menu) setMenu(null); else onClose(); } };
    const onDown = (e) => { if (menu && !(e.target.closest && e.target.closest("[data-lbmenu]"))) setMenu(null); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [menu, onClose]);

  const set = (k, val) => { setV((p) => ({ ...p, [k]: val })); if (errs[k]) setErrs((p) => ({ ...p, [k]: undefined })); };
  const submit = async () => {
    const e = {};
    if (!v.n.trim()) e.n = "Enter a project name";
    if (!v.t) e.t = "Choose a type";
    if (!v.s) e.s = "Choose a stage";
    if (!(Number(v.c) > 0)) e.c = "Enter a capacity in kWp";
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await onSubmit?.({ ...v, c: Number(v.c) });
      setSent(true);
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to add this project.');
    }
  };

  const select = (key, label, placeholder, options) => (
    <div className="lb-field" data-lbmenu>
      <div className="lb-label"><span>{label}</span></div>
      <button type="button" className={`lb-control${menu === key ? " open" : ""}${errs[key] ? " err" : ""}`} aria-haspopup="listbox" aria-expanded={menu === key} onClick={() => setMenu(menu === key ? null : key)}>
        <span className={`lb-val${v[key] ? "" : " empty"}`}>{v[key] || placeholder}</span>
        <Icon name="chevronDown" size={22} strokeWidth={2} color="currentColor" className="lb-chev" />
      </button>
      {menu === key && (
        <ul className="lb-menu" role="listbox">
          {options.map((o) => {
            const on = v[key] === o;
            return <li key={o}><button type="button" role="option" aria-selected={on} className={`lb-opt${on ? " on" : ""}`} onClick={() => { set(key, o); setMenu(null); }}>{o}{on && <Icon name="check" size={16} strokeWidth={2.2} />}</button></li>;
          })}
        </ul>
      )}
      {errs[key] && <div className="lb-msg">{errs[key]}</div>}
    </div>
  );

  return (
    <div className={`lb-ov${sent ? " center" : ""}`} style={{ left: box.left, top: box.top }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`lb-modal ${sent ? "ok" : "up"}`} role="dialog" aria-modal="true" aria-labelledby="ap-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        {sent ? (
          <div className="lb-done">
            <div className="sp" aria-hidden="true" />
            <h3 id="ap-title">Project added</h3>
            <p>You can track its progress on the pipeline board.</p>
            <button className="lb-btn lb-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="lb-head"><h2 id="ap-title">Add project</h2><p>Add a new clean energy project to track through the pipeline.</p></div>
            {requestError && <p role="alert" className="lb-msg">{requestError}</p>}
            <div className="lb-body">
              <div className="lb-field">
                <label className="lb-label" htmlFor="ap-n">Project name *</label>
                <input id="ap-n" className={`lb-control${errs.n ? " err" : ""}`} placeholder="e.g Ilorin solar estate" value={v.n} onChange={(e) => set("n", e.target.value)} />
                {errs.n && <div className="lb-msg">{errs.n}</div>}
              </div>
              <div className="lb-row">
                {select("t", "Type *", "e.g Solar", types)}
                {select("s", "Stage *", "e.g Scoping", stages)}
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ap-l">Location</label>
                <input id="ap-l" className="lb-control" placeholder="Lagos" value={v.l} onChange={(e) => set("l", e.target.value)} />
              </div>
              <div className="lb-row">
                <div className="lb-field" data-lbmenu>
                  <label className="lb-label" htmlFor="ap-c">Capacity (kWp) *</label>
                  <div className="lb-combo">
                    <input id="ap-c" inputMode="numeric" className={`lb-control${menu === "c" ? " open" : ""}${errs.c ? " err" : ""}`} placeholder="e.g 150" value={v.c} onChange={(e) => set("c", e.target.value.replace(/[^\d.]/g, ""))} />
                    <button type="button" className="lb-cbtn" tabIndex={-1} aria-label="Show common capacities" onClick={() => setMenu(menu === "c" ? null : "c")}>
                      <Icon name="chevronDown" size={22} strokeWidth={2} color="currentColor" className="lb-chev" />
                    </button>
                  </div>
                  {menu === "c" && (
                    <ul className="lb-menu" role="listbox">
                      {CAP.map((o) => <li key={o}><button type="button" role="option" aria-selected={v.c === o} className={`lb-opt${v.c === o ? " on" : ""}`} onClick={() => { set("c", o); setMenu(null); }}>{o} kWp{v.c === o && <Icon name="check" size={16} strokeWidth={2.2} />}</button></li>)}
                    </ul>
                  )}
                  {errs.c && <div className="lb-msg">{errs.c}</div>}
                </div>
                <div className="lb-field">
                  <label className="lb-label" htmlFor="ap-k">Managing contractor (optional)</label>
                  <input id="ap-k" className="lb-control" value={v.k} onChange={(e) => set("k", e.target.value)} placeholder="Enter contractor name" />
                </div>
              </div>
              <div className="lb-field">
                <label className="lb-label" htmlFor="ap-x">Notes (optional)</label>
                <textarea id="ap-x" className="lb-control" placeholder="write something here...." value={v.x} onChange={(e) => set("x", e.target.value)} />
              </div>
            </div>
            <div className="lb-foot">
              <button className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
              <button className="lb-btn lb-submit ap" onClick={submit}>Add to pipeline</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProjectDetailModal({ p, onClose, onAdvance, onViewContractor, onViewVault }) {
  const [box, setBox] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector(".dash-sidebar"), tb = document.querySelector(".dash-topbar");
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const last = p.s >= 3;
  return (
    <div className="lb-ov" style={{ left: box.left, top: box.top }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-modal ask pj" role="dialog" aria-modal="true" aria-labelledby="pj-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        <div className="lb-head"><h2 id="pj-title">{p.n}</h2><p>{p.t} project · {p.l}</p></div>
        <div className="lb-body">
          <div className="pj-sec pj-top">
            <div><span className="pj-k">Capacity</span><b className="pj-cap">{p.c} kWp</b></div>
            <div><span className="pj-k">Stage</span><b className="pj-stage" style={{ color: STG[p.s][2] === "#9CA3AF" ? "var(--lb-mut)" : STG[p.s][2] }}>● {STG[p.s][1]}</b></div>
          </div>
          <div className="pj-sec">
            <div className="pj-h">Progress</div>
            <div className="pj-step">{STG.map(([k, l], i) => <div key={k} className={i < p.s ? "d" : i === p.s ? "c" : ""}><i>{i < p.s ? "✓" : i + 1}</i>{l}</div>)}</div>
          </div>
          <div className="pj-sec">
            <div className="pj-h">Managing contractor</div>
            <div className="pj-row"><Ava c="#6B7280" t={p.k[0]} s={36} /><div><b>{p.k}</b><span>Added to pipeline {p.w}</span></div></div>
          </div>
          <div className="pj-sec">
            <div className="pj-h">Activity</div>
            {[...STG.slice(0, p.s + 1)].reverse().map(([k, l], i, a) => <div key={k} className="pj-act"><i style={{ background: STG[STG.findIndex((x) => x[0] === k)][2] }} />{i === a.length - 1 ? "Added to pipeline" : `Moved to ${l}`}</div>)}
          </div>
          <button type="button" className="pj-link" onClick={onViewVault}>View related documents in the Due Diligence Vault →</button>
        </div>
        <div className="lb-foot">
          {last && <span className="pj-done">This project is fully operational.</span>}
          {p.managingContractor && <button type="button" className="lb-btn lb-cancel" onClick={onViewContractor}>View {p.k}</button>}
          {!last && <button type="button" className="lb-btn lb-submit" onClick={onAdvance}>Advance to {STG[p.s + 1][1]} →</button>}
        </div>
      </div>
    </div>
  );
}

function Pipeline({ toast, go, allowCreate = true }) {
  const [ps, setPs] = useState([]), [sel, setSel] = useState(null), [add, setAdd] = useState(false);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    let isCurrent = true;
    projectsAPI.list({ skip: 0, take: 100 })
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? {};
        const projects = Array.isArray(payload) ? payload : payload.data || [];
        if (isCurrent) setPs(projects.map(toBoardProject));
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.response?.data?.message || 'Unable to load projects.');
      })
      .finally(() => { if (isCurrent) setLoading(false); });
    return () => { isCurrent = false; };
  }, []);
  const p = ps.find(x => x.id === sel);
  const adv = async () => {
    if (!p || p.s >= STG.length - 1) return;
    try {
      const response = await projectsAPI.updateStatus(p.id, STG[p.s + 1][0]);
      const updated = toBoardProject(response?.data?.data ?? response?.data);
      setPs((current) => current.map((project) => project.id === p.id ? updated : project));
      setSel(updated.id);
      toast(`Moved to ${STG[updated.s][1]}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update project stage.');
    }
  };
  return <>
    <div className="ph"><div><h1>Project Pipeline</h1><p>Track clean energy projects as they move from concept to operation.</p></div>{allowCreate ? <button className="btn bp" onClick={() => setAdd(true)}>+ Add project</button> : <button className="btn bp" type="button" disabled title="Project creation is currently unavailable">Create Project</button>}</div>
    {error && <p role="alert" className="sub">{error}</p>}
    <div className="card stats">{[[ps.length, "Visible projects"], [ps.filter(x => x.s === 1 || x.s === 2).length, "In development"], [ps.filter(x => x.s === 3).length, "Operational"], [`${ps.reduce((total, project) => total + project.c, 0).toLocaleString()} kWp`, "Total capacity tracked"]].map(([v, l]) => <div key={l}><b>{v}</b><span className="sub">{l}</span></div>)}</div>
    {loading && <p role="status" className="sub">Loading projects…</p>}
    <div className="board">{STG.map(([k, l, c], i) => <div className="col" key={k}><div className="row"><span style={{ width: 3, height: 16, background: c, borderRadius: 2 }} /><h3 className="sp" style={{ fontSize: 13.5 }}>{l}</h3><span className="tag">{ps.filter(x => x.s === i).length}</span></div>
      {ps.filter(x => x.s === i).map(x => <div className="pc" key={x.id} onClick={() => setSel(x.id)}><div className="row" style={{ marginBottom: 9 }}><Ty t={x.t} />{i === 3 && <span style={{ color: "var(--mt)", fontSize: 11, fontWeight: 600 }}>● Live</span>}</div><b style={{ fontSize: 13.8 }}>{x.n}</b><div className="mut row" style={{ gap: 5, margin: "6px 0 10px" }}><Icon name="mapPin" size={12} />{x.l}</div><p style={{ fontSize: 13, marginBottom: 12 }}><b style={{ color: "var(--p7)" }}>{x.c || 0} kWp</b> <span className="mut">capacity</span></p><div className="row" style={{ borderTop: "1px solid var(--ln)", paddingTop: 11 }}><Ava c="#6B7280" t={(x.k || 'P')[0]} s={22} /><span className="sub" style={{ fontSize: 12.5 }}>{x.k}</span></div></div>)}
      {!loading && !error && ps.filter(x => x.s === i).length === 0 && <p className="sub" style={{ padding: 12 }}>No projects in this stage.</p>}
      </div>)}</div>
    {p && <ProjectDetailModal p={p} onClose={() => setSel(null)} onAdvance={adv} onViewContractor={() => go("contractors", p.k)} onViewVault={() => go("vault")} />}
    {add && <AddProjectModal types={Object.keys(TYC)} stages={STG.map(s => s[1])} onClose={() => setAdd(false)}
      onSubmit={async (v) => {
        const status = STG.find((stage) => stage[1] === v.s)?.[0] || STG[0][0];
        const response = await projectsAPI.create({ title: v.n.trim(), projectType: v.t, status, location: v.l.trim() || undefined, capacityKwp: v.c, managingContractor: v.k.trim() || undefined, notes: v.x.trim() || undefined });
        const created = toBoardProject(response?.data?.data ?? response?.data);
        setPs((current) => [created, ...current]);
      }} />}
  </>;
}

function SettingsPage({ user, onOpenProfile, onOpenNotifications, onLogout }) {
  const accountTypes = {
    COMMUNITY_MEMBER: 'Community Member',
    INVESTOR: 'Investor',
    FACILITY_OPERATOR: 'Facility Operator',
    GUEST: 'Read-only Guest',
  };

  return <>
    <div className="ph"><div><h1>Settings</h1></div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16, maxWidth: 960 }}>
      <section className="card" aria-labelledby="settings-account-title">
        <h2 id="settings-account-title" style={{ fontSize: 16, marginBottom: 14 }}>Account</h2>
        <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
          <div><span className="sub">Name</span><strong style={{ display: 'block', marginTop: 3 }}>{user?.displayName || user?.name || 'Member'}</strong></div>
          <div><span className="sub">Email</span><strong style={{ display: 'block', marginTop: 3, overflowWrap: 'anywhere' }}>{user?.email || 'No email on file'}</strong></div>
          <div><span className="sub">Account type</span><strong style={{ display: 'block', marginTop: 3 }}>{accountTypes[user?.accountType] || accountTypes.COMMUNITY_MEMBER}</strong></div>
        </div>
        <button type="button" className="btn bo" onClick={onOpenProfile}>View profile</button>
      </section>
      <section className="card" aria-labelledby="settings-notifications-title">
        <h2 id="settings-notifications-title" style={{ fontSize: 16, marginBottom: 6 }}>Notifications</h2>
        <p className="sub" style={{ marginBottom: 16 }}>Review recent messages, community activity, and account updates.</p>
        <button type="button" className="btn bo" onClick={onOpenNotifications}>Open notifications</button>
      </section>
      <section className="card" aria-labelledby="settings-security-title">
        <h2 id="settings-security-title" style={{ fontSize: 16, marginBottom: 6 }}>Access and security</h2>
        <p className="sub" style={{ marginBottom: 16 }}>Sign out of Tribes Capital on this device.</p>
        <button type="button" className="btn bo" onClick={onLogout}>Sign out</button>
      </section>
    </div>
  </>;
}

/* ---------- Help & support ---------- */
const HELP_CATS = [
  { k: 'Getting started', icon: 'home', d: 'What the platform is and how to begin' },
  { k: 'Learning', icon: 'book', d: 'Courses, lessons and your progress' },
  { k: 'Community', icon: 'users', d: 'Questions, discussions and members' },
  { k: 'Contractors', icon: 'grid', d: 'Finding and contacting professionals' },
  { k: 'Investor tools', icon: 'shield', d: 'Vault, pipeline, office hours and events' },
  { k: 'Account', icon: 'settings', d: 'Profile, notifications and security' },
];

const HELP_FAQS = [
  { cat: 'Getting started', q: 'What is Tribes Capital?', a: "Tribes Capital is a community platform for people who want to understand, build and invest in clean energy. You can learn the fundamentals, connect with other members, find verified contractors and — as an investor — review projects with confidence." },
  { cat: 'Getting started', q: 'How do I get started?', a: "Head to Home and pick the goal that fits you best, such as finding a contractor, learning about renewable energy or asking the community a question. Not sure where to begin? Take the platform tour for a quick walkthrough.", act: { l: 'Go to Home', nav: 'home' } },
  { cat: 'Getting started', q: 'How do I complete my profile?', a: "Open your profile from your avatar at the top right, then choose Edit profile. Add a short bio, pick 5 or more energy interests and connect a social account to reach 100%.", act: { l: 'Open my profile', nav: 'profile' } },
  { cat: 'Learning', q: 'How do I start a course?', a: "Open Learning, choose a topic and select a course. Your progress is saved as you go, so you can leave and pick up exactly where you stopped.", act: { l: 'Go to Learning', nav: 'learning' } },
  { cat: 'Learning', q: 'Where can I see my learning progress?', a: "Your in-progress and completed courses appear at the top of the Learning page, along with a Continue button for the course you were last on." },
  { cat: 'Community', q: 'How do I ask a question?', a: "Go to Community and choose Ask a question. Give it a clear title, add some detail and pick a topic so the right members can find and answer it.", act: { l: 'Ask a question', nav: 'community:ask' } },
  { cat: 'Community', q: 'How do I connect with other members?', a: "Browse Community to find people with similar interests, follow them, and use Messaging to start a conversation once you have made a connection.", act: { l: 'Explore community', nav: 'community' } },
  { cat: 'Contractors', q: 'What does "Verified" mean on a contractor?', a: "Contractors marked Verified have had their business details and credentials reviewed by the Tribes Capital team. It is a good starting point, but we still recommend comparing quotes and checking references before you commit to a project." },
  { cat: 'Contractors', q: 'How do I find a contractor near me?', a: "Open Contractors and filter by location and the service you need — for example solar installation, battery storage or maintenance. Save the ones you like so you can compare them later.", act: { l: 'Find contractors', nav: 'contractors' } },
  { cat: 'Investor tools', q: 'What is the Due Diligence Vault?', a: "The Vault holds verified documents and records for each project — technical documentation, permits and licences, certifications and environmental and safety reports — so you can make informed investment decisions.", act: { l: 'Open the Vault', nav: 'vault' } },
  { cat: 'Investor tools', q: 'How do I speak to the team?', a: "Book a slot in Office Hours & Events to speak with the team directly, or join one of the upcoming webinars and community events.", act: { l: 'Office Hours & Events', nav: 'events' } },
  { cat: 'Account', q: 'How do I change my notification settings?', a: "Go to Settings and open the Notifications tab. You can choose which updates you receive, such as community replies and new messages.", act: { l: 'Open Settings', nav: 'settings' } },
  { cat: 'Account', q: 'I forgot my password. What should I do?', a: "On the sign-in screen choose Forgot password and enter your email address. We will send you a link to set a new one. If you are already signed in, you can change your password under Privacy & security in Settings." },
];

function HelpPage({ onGo, onTour, toast }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [openIdx, setOpenIdx] = useState(0);
  const [topic, setTopic] = useState('General question');
  const [msg, setMsg] = useState('');

  const term = q.trim().toLowerCase();
  const list = HELP_FAQS.filter((f) => (cat === 'All' || f.cat === cat) && (!term || (f.q + ' ' + f.a).toLowerCase().includes(term)));
  const send = () => {
    if (!msg.trim()) return;
    toast('Message sent — our team will reply by email');
    setMsg(''); setTopic('General question');
  };

  return <>
    <div className="ph"><div><h1>Help &amp; support</h1><p>Find answers, learn how Tribes Capital works, or get in touch with the team.</p></div></div>

    <div className="hp-hero">
      <div>
        <h2>New to Tribes Capital?</h2>
        <p>Tribes Capital is a community for people building and investing in clean energy — learn the basics, connect with members, find verified contractors and review projects. Take a quick tour to see where everything lives.</p>
      </div>
      <button type="button" className="btn bp" onClick={onTour}>Take the platform tour</button>
    </div>

    <label className="hp-search">
      <Search size={17} color="#9CA3AF" />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpenIdx(0); }} placeholder="Search help articles…" aria-label="Search help articles" />
    </label>

    <div className="hp-cats">
      {HELP_CATS.map((c) => (
        <button type="button" key={c.k} className={`hp-cat${cat === c.k ? ' on' : ''}`} aria-pressed={cat === c.k} onClick={() => { setCat(cat === c.k ? 'All' : c.k); setOpenIdx(0); }}>
          <span className="ic"><Icon name={c.icon} size={18} color="#5B21B6" /></span>
          <div><b>{c.k}</b><span>{c.d}</span></div>
        </button>
      ))}
    </div>

    <div className="hp-layout">
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 16 }}>{cat === 'All' ? 'Frequently asked questions' : cat}</h2>
          {cat !== 'All' && <button type="button" className="btn bo" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setCat('All')}>Show all</button>}
        </div>
        {list.length === 0 && <div className="hp-empty">No results{term ? ` for “${q.trim()}”` : ''}. Try different words or message the team below.</div>}
        {list.map((f, i) => (
          <div key={f.q} className={`hp-faq${openIdx === i ? ' open' : ''}`}>
            <button type="button" className="hp-q" aria-expanded={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>{f.q}<span className="hp-chev" /></button>
            {openIdx === i && <div className="hp-a">{f.a}{f.act && <div><button type="button" className="lk" onClick={() => onGo(f.act.nav)}>{f.act.l} →</button></div>}</div>}
          </div>
        ))}
      </div>

      <div>
        <button type="button" className="hp-contact" onClick={() => onGo('messaging')}>
          <span className="ic"><Icon name="message" size={18} color="#5B21B6" /></span>
          <div><b>Message the team</b><span>Chat with us in Messaging</span></div>
        </button>
        <button type="button" className="hp-contact" onClick={() => onGo('events')}>
          <span className="ic"><Icon name="calendar" size={18} color="#5B21B6" /></span>
          <div><b>Book office hours</b><span>Speak with the team directly</span></div>
        </button>
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Still need help?</h2>
          <p className="sub" style={{ marginBottom: 16, fontSize: 13 }}>Send us a message and we'll get back to you.</p>
          <div className="fld"><label htmlFor="hp-topic">Topic</label>
            <select id="hp-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {['General question', 'Problem with my account', 'Contractors', 'Investor tools', 'Report an issue', 'Feedback'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="fld"><label htmlFor="hp-msg">Message</label><textarea id="hp-msg" rows={4} placeholder="Tell us how we can help…" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
          <button type="button" className="btn bp blk" disabled={!msg.trim()} style={!msg.trim() ? { opacity: .5, cursor: 'not-allowed' } : undefined} onClick={send}>Send message</button>
        </div>
      </div>
    </div>
  </>;
}

/* ---------- Profile ---------- */
const PROFILE_BIO_MAX = 300;

function EditProfileModal({ user, profile, onSave, onClose }) {
  const [name, setName] = useState(user.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(profile.bio);
  const [sel, setSel] = useState(profile.interests);
  const [social, setSocial] = useState(profile.social);
  const [err, setErr] = useState('');
  const [box, setBox] = useState({ left: 0, top: 0 });
  const options = [...new Set([...INTERESTS, ...profile.interests])];
  const toggle = (i) => setSel((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  // Same content-area overlay as "Upload document": sits to the right of the sidebar, below the top bar
  useLayoutEffect(() => {
    const measure = () => {
      const sb = document.querySelector('.dash-sidebar'), tb = document.querySelector('.dash-topbar');
      setBox({ left: sb ? Math.max(0, Math.round(sb.getBoundingClientRect().right)) : 0, top: tb ? Math.round(tb.getBoundingClientRect().bottom) : 0 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () => {
    if (!name.trim()) { setErr('Enter your full name'); return; }
    onSave({ name: name.trim(), location: location.trim(), tagline: tagline.trim(), bio: bio.trim(), interests: sel, social: social.trim() });
  };

  return (
    <div className="lb-ov" style={{ left: box.left, top: box.top }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-modal pe" role="dialog" aria-modal="true" aria-labelledby="pe-title">
        <button className="lb-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} strokeWidth={3} /></button>
        <div className="lb-head"><h2 id="pe-title">Edit profile</h2><p>Update how you appear to other members and contractors.</p></div>
        <div className="lb-body">
          <div className="lb-field">
            <label className="lb-label" htmlFor="pe-name">Full name *</label>
            <input id="pe-name" className={`lb-control${err ? ' err' : ''}`} placeholder="Enter your full name" value={name} autoFocus onChange={(e) => { setName(e.target.value); setErr(''); }} />
            {err && <div className="lb-msg">{err}</div>}
          </div>
          <div className="lb-field">
            <label className="lb-label" htmlFor="pe-tag">Headline</label>
            <input id="pe-tag" className="lb-control" placeholder="e.g. Homeowner · Exploring solar" maxLength={80} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          <div className="lb-field">
            <label className="lb-label" htmlFor="pe-loc">Location</label>
            <input id="pe-loc" className="lb-control" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="lb-field">
            <div className="lb-label"><label htmlFor="pe-bio">About</label><em>{bio.length}/{PROFILE_BIO_MAX}</em></div>
            <textarea id="pe-bio" className="lb-control" placeholder="Tell the community a little about yourself" maxLength={PROFILE_BIO_MAX} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="lb-field">
            <div className="lb-label"><span>Energy interests</span><em>{sel.length} selected{sel.length < 5 ? ' · pick 5+' : ''}</em></div>
            <div className="lb-chips">
              {options.map((i) => <button type="button" key={i} className={`lb-chip${sel.includes(i) ? ' on' : ''}`} aria-pressed={sel.includes(i)} onClick={() => toggle(i)}>{i}</button>)}
            </div>
          </div>
          <div className="lb-field">
            <div className="lb-label"><label htmlFor="pe-soc">Social account</label><em>(optional)</em></div>
            <input id="pe-soc" className="lb-control" placeholder="linkedin.com/in/yourname or @handle" value={social} onChange={(e) => setSocial(e.target.value)} />
          </div>
        </div>
        <div className="lb-foot">
          <button type="button" className="lb-btn lb-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="lb-btn lb-submit" onClick={save}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

function Profile({ user, profile, onSave, onClose }) {
  const [editing, setEditing] = useState(false);
  const { tagline, bio, interests, social, interestsDone } = profile;
  const activity = [
    { k: "Asked", t: "Best battery setup for frequent grid outages in Lagos?", w: "2h ago" },
    { k: "Replied to", t: "How will the new NERC metering rules affect installers?", w: "1d ago" },
    { k: "Saved", t: "Helios Solar Solutions", w: "3d ago" },
  ];
  const steps = [
    { label: "Add a profile photo", done: true },
    { label: "Verify your email", done: true },
    { label: "Write a short bio", done: bio.trim().length > 0 },
    { label: "Select 5+ energy interests", done: interestsDone && interests.length >= 5 },
    { label: "Connect a social account", done: social.trim().length > 0 },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  // Esc closes the profile (unless the edit dialog is open — it handles its own close)
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !editing) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose]);

  return <>
    <div className="profile-card">
      <div className="profile-banner" />
      <button type="button" className="profile-close" onClick={onClose} aria-label="Close profile" title="Close"><X size={16} strokeWidth={2.4} /></button>
      <div className="profile-header">
        <div className="row" style={{ alignItems: "flex-end", gap: 16 }}>
          <div className="profile-avatar">{user.initial}</div>
          <div>
            <div className="profile-name">{user.name}</div>
            {tagline && <div className="profile-tagline">{tagline}</div>}
            <div className="profile-meta"><span><Icon name="mapPin" size={12} /> {user.location}</span><span>Member since Jan 2025</span></div>
          </div>
        </div>
        <button className="btn bo" onClick={() => setEditing(true)}>Edit profile</button>
      </div>
    </div>
    <div className="profile-grid">
      <div>
        <div className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 10, fontSize: 14.5 }}>About</h4>
          {bio.trim() ? <p className="sub" style={{ whiteSpace: "pre-line" }}>{bio}</p> : <p className="sub mut">Add a short bio so others know who you are.</p>}
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 14, fontSize: 14.5 }}>Energy interests</h4>
          {interests.length
            ? <div className="row wrap" style={{ gap: 10 }}>{interests.map((i) => <span key={i} className="tag" style={{ padding: "8px 14px", fontSize: 13 }}>{i}</span>)}</div>
            : <p className="sub mut">No interests selected yet.</p>}
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 6, fontSize: 14.5 }}>Recent activity</h4>
          {activity.map((a, i) => <div className="profile-activity-row" key={i}><span><b style={{ color: "var(--i6)", fontWeight: 600 }}>{a.k}</b> {a.t}</span><span className="mut">{a.w}</span></div>)}
        </div>
      </div>
      <div>
        <div className="card" style={{ marginBottom: 24, background: "var(--p0)", borderColor: "var(--p1)" }}>
          <h4 style={{ color: "var(--p9)", marginBottom: 2, fontSize: 14.5 }}>Complete your profile</h4>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><b>{pct}% complete</b><span className="mut">{steps.length - doneCount === 0 ? "All done 🎉" : `${steps.length - doneCount} step${steps.length - doneCount === 1 ? "" : "s"} left`}</span></div>
          <div className="profile-progress-bar"><span style={{ width: pct + "%" }} /></div>
          {steps.map((s) => <div key={s.label} className={`profile-step${s.done ? " done" : " pending"}`} onClick={s.done ? undefined : () => setEditing(true)} role={s.done ? undefined : "button"} tabIndex={s.done ? undefined : 0} onKeyDown={s.done ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true); } }}><span className="dot">{s.done ? "✓" : ""}</span>{s.label}</div>)}
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 16, fontSize: 14.5 }}>Your activity</h4>
          <div className="profile-stats">
            <div><b>8</b><span className="mut">Questions asked</span></div>
            <div><b>34</b><span className="mut">Replies posted</span></div>
            <div><b>5</b><span className="mut">Contractors saved</span></div>
            <div><b>12</b><span className="mut">Members followed</span></div>
          </div>
        </div>
      </div>
    </div>
    {editing && <EditProfileModal user={user} profile={profile} onClose={() => setEditing(false)} onSave={(v) => { onSave(v); setEditing(false); }} />}
  </>;
}

/* ---------- Messaging ---------- */
const ROLES = ['Homeowner', 'Energy professional', 'Learner', 'Business owner'];
const INTERESTS = [
  'Solar Energy', 'Battery Storage', 'Home Solar', 'Sustainability',
  'Wind Energy', 'Energy Efficiency', 'Renewable Policy', 'Electric Mobility',
  'Clean Cooking', 'Mini-grids', 'Energy Careers', 'Community Projects',
];

function maskEmail(email) {
  const [user, domain] = (email || '').split('@');
  if (!domain || !user) return email || 'you@email.com';
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

function initialCourseProgress() {
  const init = {};
  COURSES.forEach((c) => { init[c.id] = { started: false, completed: 0, percent: 0 }; });
  init['renewable-basics'] = { started: true, completed: 3, percent: 62 };
  return init;
}

const TOUR_STEPS = [
  { icon: 'wave', title: 'Welcome to Tribes Capital', desc: "You're now part of a community for people building and investing in clean energy. Let's show you around in 6 quick steps.", navKey: null },
  { icon: 'home', title: 'Your home', desc: "Your starting point. Tell us your goal here and we'll take you straight to the right place — contractors, learning, community and more.", navKey: 'home' },
  { icon: 'book', title: 'Your learning', desc: 'Build your knowledge of renewable energy at your own pace, from the basics through to advanced topics.', navKey: 'learning' },
  { icon: 'users', title: 'Community', desc: 'Ask questions, join discussions and share what you know with other members across the network.', navKey: 'community' },
  { icon: 'grid', title: 'Contractors', desc: 'Find and compare verified energy professionals, filtered by location and the service you need.', navKey: 'contractors' },
  { icon: 'message', title: 'Messaging', desc: "Message members directly once you've made a connection — introduce yourself and take it from there.", navKey: 'messaging' },
  { icon: 'shield', title: 'Due Diligence Vault', desc: 'Investor tool — access verified project documentation, audits and compliance materials to support your investment decisions.', navKey: 'vault' },
  { icon: 'briefcase', title: 'Project Pipeline', desc: 'Investor tool — track clean energy projects seeking investment, from early stage through to fully funded.', navKey: 'pipeline' },
  { icon: 'calendar', title: 'Office Hours & Events', desc: 'Investor tool — book time with the team, or join upcoming webinars and community events.', navKey: 'events' },
];

const SIDEBAR_WIDTH = 260;
const TOPBAR_HEIGHT = 65;
const TOUR_BREAKPOINT = 1024;

function TourOverlay({ step, navRefs, onNext, onBack, onSkip, onClose }) {
  const [pos, setPos] = useState({ centered: true, top: 0, left: 0, dimLeft: 0, dimTop: 0 });
  const cardRef = useRef(null);

  useLayoutEffect(() => {
    function compute() {
      const isNarrow = window.innerWidth < TOUR_BREAKPOINT;
      const data = TOUR_STEPS[step - 1];
      const cardH = cardRef.current ? cardRef.current.offsetHeight : 300;
      const sb = document.querySelector('.dash-sidebar');
      const tb = document.querySelector('.dash-topbar');
      const sbRight = sb ? Math.round(sb.getBoundingClientRect().right) : SIDEBAR_WIDTH;
      const tbBottom = tb ? Math.round(tb.getBoundingClientRect().bottom) : TOPBAR_HEIGHT;
      const dimLeft = sbRight;
      const dimTop = tbBottom;

      if (!data.navKey || isNarrow) {
        const contentLeft = isNarrow ? 0 : sbRight;
        const centerX = contentLeft + (window.innerWidth - contentLeft) / 2;
        const wantTop = Math.max(tbBottom + 24, window.innerHeight / 2 - cardH / 2);
        setPos({ centered: true, top: Math.max(8, Math.min(wantTop, window.innerHeight - cardH - 8)), left: centerX, dimLeft: isNarrow ? 0 : dimLeft, dimTop });
        return;
      }

      const navEl = navRefs.current[data.navKey];
      if (!navEl) {
        setPos({ centered: true, top: window.innerHeight / 2 - cardH / 2, left: dimLeft + (window.innerWidth - dimLeft) / 2, dimLeft, dimTop });
        return;
      }

      const navRect = navEl.getBoundingClientRect();
      let left = sbRight + 24;
      let top = navRect.top - 18;
      const maxTop = window.innerHeight - cardH - 16;
      if (top > maxTop) top = maxTop;
      if (top < tbBottom + 12) top = tbBottom + 12;
      const pointerTop = Math.max(24, Math.min(navRect.top + navRect.height / 2 - top, cardH - 24));
      setPos({ centered: false, top, left, pointerTop, dimLeft, dimTop });
    }

    compute();
    const id = setTimeout(compute, 0);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      clearTimeout(id);
    };
  }, [step, navRefs]);

  const data = TOUR_STEPS[step - 1];
  const isLast = step === TOUR_STEPS.length;
  const isFirst = step === 1;
  const cardStyle = pos.centered
    ? { top: pos.top, left: pos.left, transform: 'translateX(-50%)' }
    : { top: pos.top, left: pos.left };

  return (
    <>
      <div className="tour-click-block" />
      <div className="tour-dim" style={{ top: pos.dimTop || TOPBAR_HEIGHT, left: pos.dimLeft || 0, right: 0, bottom: 0 }} />
      <div className="tour-card" style={cardStyle} ref={cardRef}>
        {!pos.centered && <span className="tour-pointer" style={{ top: pos.pointerTop }} />}
        <button className="tour-close" onClick={onClose} aria-label="Close tour"><X size={13} color="#fff" strokeWidth={2.6} /></button>
        <div className="tour-top-row">
          <span className="tour-step-label">Step {step} of {TOUR_STEPS.length}</span>
          <button className="tour-skip" onClick={onSkip}>Skip tour</button>
        </div>
        <div className={`tour-icon${data.icon === 'wave' ? ' emoji' : ''}`}>
          {data.icon === 'wave' ? '👋' : <Icon name={data.icon} size={20} color="#5B21B6" />}
        </div>
        <h3 className="tour-title">{data.title}</h3>
        <p className="tour-desc">{data.desc}</p>
        <div className="tour-bottom-row">
          <div className="tour-dots">
            {TOUR_STEPS.map((_, i) => (<span key={i} className={`tour-dot${i + 1 === step ? ' active' : ''}`} />))}
          </div>
          <div className="tour-btns">
            {!isFirst && <button className="tour-back-btn" onClick={onBack}><ArrowLeft size={13} color="#374151" /> Back</button>}
            <button className="tour-next-btn" onClick={onNext}>{isLast ? 'Get started' : 'Next'} <ArrowRight size={13} color="#fff" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

class RouteErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <div role="alert" style={{ maxWidth: 640, margin: '12vh auto', padding: 24, color: '#172033', textAlign: 'center' }}><h1>Page couldn’t load</h1><p>Something went wrong while opening this page. Return home and try again.</p><button type="button" className="tca-btn-primary" onClick={this.props.onRecover}>Return home</button></div>;
  }
}

export default function TribesCapitalApp({ initialScreen = 'signin', user: authenticatedUser, onLogout: onAuthenticatedLogout, onUpdateUser = () => {} } = {}) {
  const [screen, setScreen] = useState(initialScreen);
  const [viewedProfileId, setViewedProfileId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState(authenticatedUser?.avatar || null);
  const toastTimer = useRef(null);

  // Make sure mobile browsers render at device width and let the layout extend under notches
  useEffect(() => {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  }, []);

  // Dashboard / tour
  const navRefs = useRef({});
  const sidebarRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [tourSeen, setTourSeen] = useState(false);

  const [contractorQ, setContractorQ] = useState('');
  const [communityOpen, setCommunityOpen] = useState(null);

  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPwd, setSiShowPwd] = useState(false);
  const [siKeep, setSiKeep] = useState(false);

  const [caName, setCaName] = useState('');
  const [caEmail, setCaEmail] = useState('');
  const [caPassword, setCaPassword] = useState('');
  const [caShowPwd, setCaShowPwd] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [resendSeconds, setResendSeconds] = useState(28);

  const [pfName, setPfName] = useState('');
  const [pfLocation, setPfLocation] = useState('');
  const [pfRole, setPfRole] = useState(null);
  const [pfBio, setPfBio] = useState('');
  const [pfPhoto, setPfPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const [interests, setInterests] = useState([]);

  const profileReturn = useRef('dashboard');   // screen to go back to when the profile is closed

  const [fpEmail, setFpEmail] = useState('');
  const [rpNew, setRpNew] = useState('');
  const [rpConfirm, setRpConfirm] = useState('');
  const [rpShowNew, setRpShowNew] = useState(false);
  const [rpShowConfirm, setRpShowConfirm] = useState(false);

  function navigate(next) {
    if (next === 'profile' && screen !== 'profile') profileReturn.current = screen;
    setScreen(next);
    window.scrollTo(0, 0);
    // First-time users land on Home and are greeted by the guided tour (Step 1 of 9)
    if (next === 'dashboard' && !tourSeen) {
      setTourStep(1);
      setTourSeen(true);
      setTimeout(() => setTourOpen(true), 250);
    }
  }
  function showToast(msg) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3000);
  }

  useEffect(() => {
    if (screen !== 'verify-email') return undefined;
    setResendSeconds(28);
    const id = setInterval(() => setResendSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [screen]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const signInValid = siEmail.includes('@') && siPassword.length > 0;
  const createValid = caName.trim().length > 0 && caEmail.includes('@') && caPassword.length >= 6;
  const forgotValid = fpEmail.includes('@');
  const pwdLenOk = rpNew.length >= 8;
  const pwdCaseOk = /[a-z]/.test(rpNew) && /[A-Z]/.test(rpNew);
  const pwdNumOk = /[0-9]/.test(rpNew);
  const resetValid = pwdLenOk && pwdCaseOk && pwdNumOk && rpConfirm.length > 0 && rpNew === rpConfirm;

  function handleOtpChange(i, val) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) { const el = otpRefs.current[i + 1]; if (el) el.focus(); }
  }
  function handleOtpKeyDown(i, e) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) { const el = otpRefs.current[i - 1]; if (el) el.focus(); }
  }
  const otpComplete = otp.every((d) => d !== '');

  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPfPhoto(URL.createObjectURL(file));
  }
  function toggleInterest(label) {
    setInterests((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  }

  function handleSignIn() { if (signInValid) navigate('dashboard'); }
  function handleCreateAccount() { if (createValid) navigate('verify-email'); }
  function handleVerifyEmail() { if (otpComplete) navigate('complete-profile'); }
  function handleResendCode() { if (resendSeconds > 0) return; setResendSeconds(28); showToast('A new code has been sent'); }
  function finishOnboarding() { navigate('dashboard'); }
  function handleForgotSubmit() { if (forgotValid) navigate('check-email'); }
  function handleResendLink() { showToast('Reset link resent'); }
  function handleOpenEmailApp() {
    showToast('Opening your email app…');
    try { window.location.href = 'mailto:'; } catch (e) { /* no-op in sandboxed preview */ }
    setTimeout(() => navigate('reset-password'), 1200);
  }
  function handleResetPassword() { if (resetValid) navigate('reset-success'); }

  function tourNext() {
    if (tourStep >= TOUR_STEPS.length) { setTourOpen(false); return; }
    setTourStep((s) => s + 1);
  }
  function tourBack() { setTourStep((s) => Math.max(1, s - 1)); }
  function tourSkip() { setTourOpen(false); }
  function reopenTour() { setTourStep(1); setTourOpen(true); }
  function openHelp() { navigate('help'); }

  const PAGES = ['learning', 'events', 'community', 'contractors', 'messaging', 'vault', 'pipeline', 'submit-project', 'settings'];
  function handleSidebarNav(key) {
    const [k, arg] = key.split(':');
    if (k === 'home') { navigate('dashboard'); return; }
    if (!PAGES.includes(k)) return;
    if (k === 'community') setCommunityOpen(arg || null);
    if (k === 'contractors') setContractorQ('');
    navigate(k);
  }
  function goApp(k, query = '') {
    if (k === 'contractors') {
      setContractorQ(query);
      navigate('contractors');
      return;
    }
    handleSidebarNav(k);
  }
  function searchContractors(query) { setContractorQ(query); navigate('contractors'); }
  function logOut() {
    setTourOpen(false);
    if (onAuthenticatedLogout) {
      onAuthenticatedLogout();
      return;
    }
    navigate('signin');
    showToast('You have been logged out');
  }

  const fallbackUser = { name: 'Member', initial: 'M', email: '', location: '', city: '' };
  const userName = authenticatedUser?.displayName || authenticatedUser?.name || authenticatedUser?.firstName || authenticatedUser?.email?.split('@')[0] || fallbackUser.name;
  const user = {
    ...fallbackUser,
    ...authenticatedUser,
    name: userName,
    initial: userName[0]?.toUpperCase() || fallbackUser.initial,
    email: authenticatedUser?.email || fallbackUser.email,
    location: authenticatedUser?.location || fallbackUser.location,
    city: authenticatedUser?.city || authenticatedUser?.location?.split(',')[0] || fallbackUser.city,
  };
  function closeProfile() {
    const back = profileReturn.current;
    navigate(back && back !== 'profile' ? back : 'dashboard');
  }
  const shellProps = { onSearch: searchContractors, onLogout: logOut, onOpenProfile: () => navigate('profile'), user };
  let bodyEl = null;

  if (screen === 'signin') {
    bodyEl = (
      <AuthShell leftHeading="Welcome back to the clean energy community.">
        <h1 className="tca-h1">Welcome back</h1>
        <p className="tca-sub">Sign in to continue your clean energy journey.</p>
        <Field label="Email address" type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
        <PasswordField label="Password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} placeholder="Enter your password" show={siShowPwd} onToggle={() => setSiShowPwd((s) => !s)} autoComplete="current-password" />
        <div className="tca-row-between">
          <label className="tca-checkbox">
            <input type="checkbox" checked={siKeep} onChange={(e) => setSiKeep(e.target.checked)} style={{ accentColor: '#5B21B6' }} />
            Keep me signed in
          </label>
          <button type="button" className="tca-link" onClick={() => navigate('forgot-password')}>Forgot password?</button>
        </div>
        <PrimaryButton enabled={signInValid} onClick={handleSignIn}>Sign in</PrimaryButton>
        <Divider />
        <GoogleButton onClick={() => navigate('dashboard')}>Continue with Google</GoogleButton>
        <p className="tca-footer-text">
          New to Tribes Capital? <button type="button" className="tca-link" onClick={() => navigate('create-account')}>Create an account</button>
        </p>
      </AuthShell>
    );
  } else if (screen === 'create-account') {
    bodyEl = (
      <AuthShell leftHeading="Join the clean energy community.">
        <StepDots current={1} />
        <h1 className="tca-h1">Create your account</h1>
        <p className="tca-sub">Start your clean energy journey in a couple of minutes.</p>
        <Field label="Full name" value={caName} onChange={(e) => setCaName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />
        <Field label="Email address" type="email" value={caEmail} onChange={(e) => setCaEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
        <PasswordField label="Password" value={caPassword} onChange={(e) => setCaPassword(e.target.value)} placeholder="Create a password" show={caShowPwd} onToggle={() => setCaShowPwd((s) => !s)} autoComplete="new-password" />
        <div style={{ marginTop: 6 }}>
          <PrimaryButton enabled={createValid} onClick={handleCreateAccount}>Create account</PrimaryButton>
        </div>
        <Divider />
        <GoogleButton onClick={() => navigate('dashboard')}>Continue with Google</GoogleButton>
        <p className="tca-footer-text">
          Already have an account? <button type="button" className="tca-link" onClick={() => navigate('signin')}>Sign in</button>
        </p>
      </AuthShell>
    );
  } else if (screen === 'verify-email') {
    const mm = Math.floor(resendSeconds / 60);
    const ss = String(resendSeconds % 60).padStart(2, '0');
    bodyEl = (
      <AuthShell leftHeading="One quick check.">
        <h1 className="tca-h1">Verify your email</h1>
        <p className="tca-sub">We sent a 6-digit code to {caEmail || 'you@email.com'}. Enter it below to confirm your account.</p>
        <div className="tca-otp-row">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              className="tca-otp-box"
            />
          ))}
        </div>
        <PrimaryButton enabled={otpComplete} onClick={handleVerifyEmail}>Verify email</PrimaryButton>
        <p className="tca-footer-text" style={{ marginTop: 20 }}>
          Didn't get a code?{' '}
          {resendSeconds > 0 ? (
            <span style={{ color: '#9CA3AF' }}>Resend in {mm}:{ss}</span>
          ) : (
            <button type="button" className="tca-link" onClick={handleResendCode}>Resend code</button>
          )}
        </p>
        <BackLink onClick={() => navigate('create-account')}>Change email address</BackLink>
      </AuthShell>
    );
  } else if (screen === 'complete-profile') {
    bodyEl = (
      <OnboardingShell onSkip={finishOnboarding}>
        <StepDots current={2} />
        <h1 className="tca-onboard-h1">Complete your profile</h1>
        <p className="tca-onboard-sub">Add a few details so the community and contractors can get to know you.</p>
        <div className="tca-photo-wrap">
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          <button type="button" className="tca-photo-btn" onClick={() => photoInputRef.current && photoInputRef.current.click()}>
            {pfPhoto ? <img src={pfPhoto} alt="Profile preview" /> : <Camera size={19} color="#5B21B6" />}
          </button>
          <button type="button" className="tca-photo-label" onClick={() => photoInputRef.current && photoInputRef.current.click()}>
            {pfPhoto ? 'Change photo' : 'Add a photo'}
          </button>
        </div>
        <div className="tca-onboard-inner">
          <Field label="Full name" value={pfName} onChange={(e) => setPfName(e.target.value)} placeholder="Enter your full name" />
          <Field label="Location" value={pfLocation} onChange={(e) => setPfLocation(e.target.value)} placeholder="Enter your location" />
          <div style={{ marginBottom: 16 }}>
            <label className="tca-fieldset-label">I'm here as a...</label>
            <div className="tca-pills">
              {ROLES.map((r) => (<Pill key={r} label={r} selected={pfRole === r} onClick={() => setPfRole(r)} />))}
            </div>
          </div>
          <div className="tca-field" style={{ marginBottom: 30 }}>
            <label>Short bio</label>
            <textarea value={pfBio} onChange={(e) => setPfBio(e.target.value)} placeholder="Write your bio" rows={4} />
          </div>
          <div className="tca-btn-row">
            <OutlineButton onClick={() => navigate('create-account')}>Back</OutlineButton>
            <PrimaryButton enabled onClick={() => navigate('interests')} icon={<ArrowRight size={16} color="#fff" />}>Continue</PrimaryButton>
          </div>
        </div>
      </OnboardingShell>
    );
  } else if (screen === 'interests') {
    bodyEl = (
      <OnboardingShell onSkip={finishOnboarding}>
        <StepDots current={3} />
        <h1 className="tca-onboard-h1">What are you interested in?</h1>
        <p className="tca-onboard-sub">Pick a few topics and we will personalise your home, learning and community feed. You can change these anytime.</p>
        <div className="tca-onboard-inner wide">
          <div className="tca-pills center" style={{ marginBottom: 30 }}>
            {INTERESTS.map((topic) => (<Pill key={topic} label={topic} selected={interests.includes(topic)} onClick={() => toggleInterest(topic)} />))}
          </div>
          <div className="tca-btn-row">
            <OutlineButton onClick={() => navigate('complete-profile')}>Back</OutlineButton>
            <PrimaryButton enabled onClick={finishOnboarding} icon={<ArrowRight size={16} color="#fff" />}>Continue</PrimaryButton>
          </div>
        </div>
      </OnboardingShell>
    );
  } else if (screen === 'forgot-password') {
    bodyEl = (
      <AuthShell leftHeading="Let's get you back in.">
        <h1 className="tca-h1">Forgot your password?</h1>
        <p className="tca-sub">Enter the email linked to your account and we'll send you a link to reset your password.</p>
        <Field label="Email address" type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
        <div style={{ marginTop: 6 }}>
          <PrimaryButton enabled={forgotValid} onClick={handleForgotSubmit}>Send reset link</PrimaryButton>
        </div>
        <BackLink onClick={() => navigate('signin')}>Back to sign in</BackLink>
      </AuthShell>
    );
  } else if (screen === 'check-email') {
    bodyEl = (
      <AuthShell leftHeading="Almost there.">
        <div className="tca-mail-icon"><span><Mail size={24} color="#5B21B6" /></span></div>
        <h1 className="tca-h1">Check your email</h1>
        <p className="tca-sub">We've sent a password reset link to {maskEmail(fpEmail)}. Click the link in the email to choose a new password.</p>
        <PrimaryButton enabled onClick={handleOpenEmailApp}>Open email app</PrimaryButton>
        <p className="tca-footer-text">
          Didn't get the email? <button type="button" className="tca-link" onClick={handleResendLink}>Resend link</button>
        </p>
        <BackLink onClick={() => navigate('signin')}>Back to sign in</BackLink>
      </AuthShell>
    );
  } else if (screen === 'reset-password') {
    bodyEl = (
      <AuthShell leftHeading="Set a fresh password.">
        <h1 className="tca-h1">Create a new password</h1>
        <p className="tca-sub">Choose a strong password you haven't used before.</p>
        <PasswordField label="New password" value={rpNew} onChange={(e) => setRpNew(e.target.value)} placeholder="Create a password" show={rpShowNew} onToggle={() => setRpShowNew((s) => !s)} autoComplete="new-password" />
        <PasswordField label="Confirm password" value={rpConfirm} onChange={(e) => setRpConfirm(e.target.value)} placeholder="Re-enter new password" show={rpShowConfirm} onToggle={() => setRpShowConfirm((s) => !s)} autoComplete="new-password" />
        <div className="tca-req-list">
          <ReqItem met={pwdLenOk}>At least 8 characters</ReqItem>
          <ReqItem met={pwdCaseOk}>One uppercase and one lowercase letter</ReqItem>
          <ReqItem met={pwdNumOk}>At least one number</ReqItem>
        </div>
        <PrimaryButton enabled={resetValid} onClick={handleResetPassword}>Reset password</PrimaryButton>
        <BackLink onClick={() => navigate('signin')}>Back to sign in</BackLink>
      </AuthShell>
    );
  } else if (screen === 'reset-success') {
    bodyEl = (
      <AuthShell leftHeading="You're all set." showLogo={false}>
        <h1 className="tca-success-h1">Password updated</h1>
        <p className="tca-success-sub">Your password has been changed successfully. You can now sign in with your new password.</p>
        <PrimaryButton enabled onClick={() => navigate('signin')}>Back to sign in</PrimaryButton>
      </AuthShell>
    );
  } else if (screen === 'dashboard') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="home" onNavigate={handleSidebarNav} {...shellProps}>
        <DashboardHomeContent onGo={handleSidebarNav} />
      </AppShell>
    );
  } else if (screen === 'learning') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="learning" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx learning-hub-shell"><LearningHub onBack={() => navigate('dashboard')} onToggleSidebar={() => {}} /></div>
      </AppShell>
    );
  } else if (screen === 'events') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="events" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><OfficeHoursEvents onBack={() => navigate('dashboard')} onToggleSidebar={() => {}} /></div>
      </AppShell>
    );
  } else if (screen === 'community') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="community" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><Community key={communityOpen || 'all'} open={communityOpen} user={user} toast={showToast} onOpenMessaging={() => navigate('messaging')} /></div>
      </AppShell>
    );
  } else if (screen === 'contractors') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="contractors" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><Contractors key={contractorQ} initQ={contractorQ} go={goApp} /></div>
      </AppShell>
    );
  } else if (screen === 'messaging') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="messaging" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><MessagingPage user={user} onViewProfile={(person) => { setViewedProfileId(person.id); navigate('member-profile'); }} /></div>
      </AppShell>
    );
  } else if (screen === 'vault') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="vault" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><DueDiligenceVault /></div>
      </AppShell>
    );
  } else if (screen === 'pipeline') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="pipeline" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><Pipeline toast={showToast} go={goApp} allowCreate={false} /></div>
      </AppShell>
    );
  } else if (screen === 'submit-project') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="submit-project" onNavigate={handleSidebarNav} {...shellProps}>
        <SubmitYourProjectPage />
      </AppShell>
    );
  } else if (screen === 'settings') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="settings" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><SettingsPage user={user} onOpenProfile={() => navigate('profile')} onOpenNotifications={() => window.dispatchEvent(new CustomEvent('tribes:open-notifications'))} onLogout={logOut} /></div>
      </AppShell>
    );
  } else if (screen === 'help') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="help" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><HelpPage onGo={(k) => (k === 'profile' ? navigate('profile') : handleSidebarNav(k))} onTour={reopenTour} toast={showToast} /></div>
      </AppShell>
    );
  } else if (screen === 'profile') {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><ProfileSettings user={user} avatarDataUrl={avatarDataUrl} onAvatarChange={(event) => setAvatarDataUrl(event?.dataUrl || null)} onClose={closeProfile} onSaved={onUpdateUser} onMessage={() => handleSidebarNav('messaging')} /></div>
      </AppShell>
    );
  } else if (screen === 'member-profile' && viewedProfileId) {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="messaging" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx"><PublicProfilePage userId={viewedProfileId} onClose={() => navigate('messaging')} /></div>
      </AppShell>
    );
  }

  if (!bodyEl) {
    bodyEl = (
      <AppShell navRefs={navRefs} sidebarRef={sidebarRef} onOpenHelp={openHelp} activeKey="" onNavigate={handleSidebarNav} {...shellProps}>
        <div className="tcx">
          <div className="tca-not-found">
            <div className="tca-not-found-card">
              <img className="tca-not-found-illustration" src="/illustrations/404-error-black-hole-page-not-found-illustrations.svg" alt="Page not found illustration" />
              <h1>Page not found</h1>
              <p>The page you’re looking for may have moved, been removed, or never existed.</p>
              <button type="button" className="tca-btn-primary" onClick={() => navigate('dashboard')}>Back to home</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="tca">
      <style>{STYLES}</style>
      <RouteErrorBoundary key={screen} onRecover={() => navigate('dashboard')}><Suspense fallback={<div className="route-loading-state" role="status" aria-live="polite"><span className="route-loading-spinner" aria-hidden="true" /><span>Loading page…</span><span className="route-loading-skeleton" aria-hidden="true"><i /><i /><i /></span></div>}>{bodyEl}</Suspense></RouteErrorBoundary>
      {tourOpen && (
        <TourOverlay
          step={tourStep}
          navRefs={navRefs}
          onNext={tourNext}
          onBack={tourBack}
          onSkip={tourSkip}
          onClose={tourSkip}
        />
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

