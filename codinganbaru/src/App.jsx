import React from "react";
import BaseProtectedRoute from "./components/routes/BaseProtectedRoute";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import UserProtectedRoute from "./components/routes/UserProtectedRoute";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

import DashboardPage from "./pages/dashboard/DashboardPage";
import PreviewDashboardInfo from "./pages/dashboard/PreviewDashboardInfo";

import ProjectPage from "./pages/project/ProjectPage";
import HsePage from "./pages//hse/HsePage";
import HsePtPage from "./pages/hse/HsePtPage";

import LoginUser from "./pages/login/LoginUser";
import ManagementPage from "./pages/management/ManagementPage";
import AddManagementPage from "./pages/management/AddManagementPage";
import EditManagementPage from "./pages/management/EditManagementPage";

import AccountPage from "./pages/account/AccountPage";
import AccountEditMA from "./pages/account/AccountEditMA";
import AccountEditUser from "./pages/account/AccountEditUser";

import LoginPage from "./pages/login/LoginPage";

import ElnusaViewProjectPage from "./pages/project/elnusaedit/ElnusaViewProjectPage";
import ElnusaEditProjectPage from "./pages/project/elnusaedit/ElnusaEditProjectPage";
import ElnusaNAProjectPage from "./pages/project/elnusaedit/ElnusaNAProjectPage";
import TambahUserElnusa from "./pages/project/elnusaedit/TambahUserElnusa";
import UploadMassalElnusa from "./pages/project/elnusaedit/UploadMassalElnusa";

import Pertamina4EditProjectPage from "./pages/project/pertamina4edit/Pertamina4EditProjectPage";
import Pertamina4ViewProjectPage from "./pages/project/pertamina4edit/Pertamina4ViewProjectPage";
import Pertamina4NAProjectPage from "./pages/project/pertamina4edit/Pertamina4NAProjectPage";
import TambahUserPertamina4 from "./pages/project/pertamina4edit/TambahUserPertamina4";
import UploadMassalPertamina4 from "./pages/project/pertamina4edit/UploadMassalPertamina4";

import Pertamina2XEditProjectPage from "./pages/project/pertamina2eks/Pertamina2XEditProjectPage";
import Pertamina2XViewProjectPage from "./pages/project/pertamina2eks/Pertamina2XViewProjectPage";
import Pertamina2XNAProjectPage from "./pages/project/pertamina2eks/Pertamina2XNAProjectPage";
import TambahUserPertamina2X from "./pages/project/pertamina2eks/TambahUserPertamina2X";
import UploadMassalPertamina2X from "./pages/project/pertamina2eks/UploadMassalPertamina2X";

import Pertamina2SEditProjectPage from "./pages/project/pertamina2sub/Pertamina2SEditProjectPage";
import Pertamina2SViewProjectPage from "./pages/project/pertamina2sub/Pertamina2SViewProjectPage";
import Pertamina2SNAProjectPage from "./pages/project/pertamina2sub/Pertamina2SNAProjectPage";
import TambahUserPertamina2S from "./pages/project/pertamina2sub/TambahUserPertamina2S";
import UploadMassalPertamina2S from "./pages/project/pertamina2sub/UploadMassalPertamina2S";

import Pertamina2Z7DEditProjectPage from "./pages/project/pertamina2z7dev/Pertamina2Z7DEditProjectPage";
import Pertamina2Z7DViewProjectPage from "./pages/project/pertamina2z7dev/Pertamina2Z7DViewProjectPage";
import Pertamina2Z7DNAProjectPage from "./pages/project/pertamina2z7dev/Pertamina2Z7DNAProjectPage";
import TambahUserPertamina2Z7D from "./pages/project/pertamina2z7dev/TambahUserPertamina2Z7D";
import UploadMassalPertamina2Z7D from "./pages/project/pertamina2z7dev/UploadMassalPertamina2Z7D";

import Pertamina2Z7WEditProjectPage from "./pages/project/pertamina2z7wop/Pertamina2Z7WEditProjectPage";
import Pertamina2Z7WViewProjectPage from "./pages/project/pertamina2z7wop/Pertamina2Z7WViewProjectPage";
import Pertamina2Z7WNAProjectPage from "./pages/project/pertamina2z7wop/Pertamina2Z7WNAProjectPage";
import TambahUserPertamina2Z7W from "./pages/project/pertamina2z7wop/TambahUserPertamina2Z7W";
import UploadMassalPertamina2Z7W from "./pages/project/pertamina2z7wop/UploadMassalPertamina2Z7W";

import UmranEditProjectPage from "./pages/project/umran/UmranEditProjectPage";
import UmranViewProjectPage from "./pages/project/umran/UmranViewProjectPage";
import UmranNAProjectPage from "./pages/project/umran/UmranNAProjectPage";
import TambahUserUmran from "./pages/project/umran/TambahUserUmran";
import UploadMassalUmran from "./pages/project/umran/UploadMassalUmran";

import ElnusaHSEPage from "./pages/hse/elnusa/ElnusaHSEPage";
import FormElnusaHSEEdit from "./pages/hse/elnusa/FormElnusaHSEEdit";
import ViewElnusaHSEPage from "./pages/hse/elnusa/ViewElnusaHSEPage";

import TarHSEPage from "./pages/hse/tar/TarHSEPage";
import ViewTarHSEPage from "./pages/hse/tar/ViewTarHSEPage";

import Regional4HSEPage from "./pages/hse/regional4/Regional4HSEPage";
import FormRegional4HSEEdit from "./pages/hse/regional4/FormRegional4HSEEdit";
import ViewRegional4HSEPage from "./pages/hse/regional4/ViewRegional4HSEPage";

import Regional2XHSEPage from "./pages/hse/regional2ex/Regional2XHSEPage";
import FormRegional2XHSEEdit from "./pages/hse/regional2ex/FormRegional2XHSEEdit";
import ViewRegional2XHSEPage from "./pages/hse/regional2ex/ViewRegional2XHSEPage";

import Regional2SHSEPage from "./pages/hse/regional2sub/Regional2SHSEPage"
import FormRegional2SHSEEdit from "./pages/hse/regional2sub/FormRegional2SHSEEdit";
import ViewRegional2SHSEPage from "./pages/hse/regional2sub/ViewRegional2SHSEPage";

import Regional2Z7DHSEPage from "./pages/hse/regional2z7devplan/Regional2Z7DHSEPage"; 
import FormRegional2Z7DHSEEdit from "./pages/hse/regional2z7devplan/FormRegional2Z7DHSEEdit";
import ViewRegional2Z7DHSEPage from "./pages/hse/regional2z7devplan/ViewRegional2Z7DHSEPage";

import Regional2Z7WHSEPage from "./pages/hse/regional2z7wopdm/Regional2Z7WHSEPage";
import FormRegional2Z7WHSEEdit from "./pages/hse/regional2z7wopdm/FormRegional2Z7WHSEEdit";
import ViewRegional2Z7WHSEPage from "./pages/hse/regional2z7wopdm/ViewRegional2Z7WHSEPage";

// Gunakan hanya satu import untuk UserPreviewDashboardInfo
import UserPreviewDashboardInfo from "./pages/User/UserPreviewDashboardInfo";
import ElnusaUser from "./pages/User/ElnusaUser";
import Pertamina4User from "./pages/User/Pertamina4User";
import Pertamina2EksplorasiUser from "./pages/User/Pertamina2EksplorasiUser";
import Pertamina2SubsurfaceUser from "./pages/User/Pertamina2SubsurfaceUser";
import Pertamina2Zona7DevplanUser from "./pages/User/Pertamina2Zona7DevplanUser";
import Pertamina2Zona7WopdmUser from "./pages/User/Pertamina2Zona7WopdmUser";
import UmranUser from "./pages/User/UmranUser";
import CElnusa from "./pages/User/kontrak/CElnusa";
import CReg4 from "./pages/User/kontrak/CReg4";
import CReg2x from "./pages/User/kontrak/CReg2x";
import CReg2s from "./pages/User/kontrak/CReg2s";
import CReg2z7d from "./pages/User/kontrak/CReg2z7d";
import CReg2z7w from "./pages/User/kontrak/CReg2z7w";
import CUmr from "./pages/User/kontrak/CUmr";
import DElnusa from "./pages/User/datahse/DElnusa";
import DReg4 from "./pages/User/datahse/DReg4";
import DReg2x from "./pages/User/datahse/DReg2x";
import DReg2s from "./pages/User/datahse/DReg2s";
import DReg2z7d from "./pages/User/datahse/DReg2z7d";
import DReg2z7w from "./pages/User/datahse/DReg2z7w";
import DUmr from "./pages/User/datahse/DUmr";


function App() {

  return (  
    <Routes>

       {/* Semua rute pengguna dilindungi oleh satu UserProtectedRoute */}
      <Route element={<UserProtectedRoute />}>
        {/* PT. Elnusa */}
        <Route path="/user-els" element={<ElnusaUser />} />
        <Route path="/contract-els" element={<CElnusa />} />
        <Route path="/data-hse-els" element={<DElnusa />} />
        
        {/* PT. Pertamina Ep Reg 4 */}
        <Route path="/user-reg4" element={<Pertamina4User />} />
        <Route path="/contract-reg4" element={<CReg4 />} />
        <Route path="/data-hse-reg4" element={<DReg4 />} />
        
        {/* PT. Pertamina Ep Reg 2 Eksplorasi */}
        <Route path="/user-reg2x" element={<Pertamina2EksplorasiUser />} />
        <Route path="/contract-reg2x" element={<CReg2x/>} />
        <Route path="/data-hse-reg2x" element={<DReg2x/>} />
        
        {/* PT. Pertamina Ep Reg 2 Subsurface */}
        <Route path="/user-reg2s" element={<Pertamina2SubsurfaceUser />} />
        <Route path="/contract-reg2s" element={<CReg2s />} />
        <Route path="/data-hse-reg2s" element={<DReg2s />} />

        {/* PT. Pertamina Ep Reg 2 Zona 7 DevPlan */}
        <Route path="/user-reg2z7d" element={<Pertamina2Zona7DevplanUser />} />
        <Route path="/contract-reg2z7d" element={<CReg2z7d />} />
        <Route path="/data-hse-reg2z7d" element={<DReg2z7d />} />

        {/* PT. Pertamina Ep Reg 2 Zona 7 WOPDM */}
        <Route path="/user-reg2z7w" element={<Pertamina2Zona7WopdmUser />} />
        <Route path="/contract-reg2z7w" element={<CReg2z7w />} />
        <Route path="/data-hse-reg2z7w" element={<DReg2z7w />} />
        
        {/* PT. Umran Rubi Perkasa */}
        <Route path="/user-urp" element={<UmranUser />} />
        <Route path="/contract-urp" element={<CUmr />} />
        <Route path="/data-hse-urp" element={<DUmr />} />

        
        <Route path="/user-dashboard/preview/:id" element={<UserPreviewDashboardInfo />} />
      </Route>
      
      <Route path="/logadm" Component={LoginPage} />
      <Route path="/log-user" Component={LoginUser} />

      {/* Aplikasikan BaseProtectedRoute untuk semua rute berikut */}
      <Route element={<BaseProtectedRoute />}>
        {/* Rute Reguler - Hanya memerlukan login dasar */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/project" element={<ProjectPage />} />
        <Route path="/dashboard/preview/:id" element={<PreviewDashboardInfo/>} />
        <Route path="/elnusa-view" element={<ElnusaViewProjectPage />} />
        <Route path="/regional4-view" element={<Pertamina4ViewProjectPage />} />
        <Route path="/regional2x-view" element={<Pertamina2XViewProjectPage />} />
        <Route path="/regional2s-view" element={<Pertamina2SViewProjectPage />} />
        <Route path="/regional2z7d-view" element={<Pertamina2Z7DViewProjectPage />} />
        <Route path="/regional2z7w-view" element={<Pertamina2Z7WViewProjectPage />} />
        <Route path="/umran-view" element={<UmranViewProjectPage />} />
        <Route path="/hse-tar-view" element={<ViewTarHSEPage />} />
        <Route path="/hse-elnusa-view" element={<ViewElnusaHSEPage />} />
        <Route path="/hse-regional4-view" element={<ViewRegional4HSEPage />} />
        <Route path="/hse-regional2x-view" element={<ViewRegional2XHSEPage />} />
        <Route path="/hse-regional2s-view" element={<ViewRegional2SHSEPage />} />
        <Route path="/hse-regional2z7d-view" element={<ViewRegional2Z7DHSEPage />} />
        <Route path="/hse-regional2z7w-view" element={<ViewRegional2Z7WHSEPage />} />
        <Route path="/hse" element={<HsePage />} />
        <Route path="/hse-pt" element={<HsePtPage />} />
        <Route path="/management" element={<ManagementPage />} />
        <Route path="/account" element={<AccountPage />} />

        {/* Rute dengan Perlindungan Khusus - Memerlukan akses spesifik */}
        {/* Elnusa routes */}
        <Route path="/elnusa-edit" 
          element={<ProtectedRoute requiredAccess="/elnusa-edit"><ElnusaEditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-elnusa" 
          element={<ProtectedRoute requiredAccess="/nonactive-elnusa"><ElnusaNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-elnusa" 
          element={<ProtectedRoute requiredAccess="/tambah-user-elnusa"><TambahUserElnusa /></ProtectedRoute>} />
        <Route path="/upload-massal-elnusa" 
          element={<ProtectedRoute requiredAccess="/upload-massal-elnusa"><UploadMassalElnusa /></ProtectedRoute>} />
        
        {/* Pertamina Regional 4 routes */}
        <Route path="/regional4-edit" 
          element={<ProtectedRoute requiredAccess="/regional4-edit"><Pertamina4EditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-regional4" 
          element={<ProtectedRoute requiredAccess="/nonactive-regional4"><Pertamina4NAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-regional4" 
          element={<ProtectedRoute requiredAccess="/tambah-user-regional4"><TambahUserPertamina4 /></ProtectedRoute>} />
        <Route path="/upload-massal-regional4" 
          element={<ProtectedRoute requiredAccess="/uploadmassal-regional4"><UploadMassalPertamina4 /></ProtectedRoute>} />

        {/* Pertamina Regional 2 Eksplorasi routes */}
        <Route path="/regional2x-edit" 
          element={<ProtectedRoute requiredAccess="/regional2x-edit"><Pertamina2XEditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-regional2x" 
          element={<ProtectedRoute requiredAccess="/nonactive-regional2x"><Pertamina2XNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-regional2x" 
          element={<ProtectedRoute requiredAccess="/tambah-user-regional2x"><TambahUserPertamina2X /></ProtectedRoute>} />
        <Route path="/upload-massal-regional2x" 
          element={<ProtectedRoute requiredAccess="/upload-massal-regional2x"><UploadMassalPertamina2X /></ProtectedRoute>} />

        {/* Pertamina Regional 2 Subsurface routes */}
        <Route path="/regional2s-edit" 
        element={<ProtectedRoute requiredAccess="/regional2s-edit"><Pertamina2SEditProjectPage /></ProtectedRoute> } />
        <Route path="/nonactive-regional2s" 
          element={<ProtectedRoute requiredAccess="/nonactive-regional2s"><Pertamina2SNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-regional2s" 
          element={<ProtectedRoute requiredAccess="/tambah-user-regional2s"><TambahUserPertamina2S /></ProtectedRoute>} />
        <Route path="/upload-massal-regional2s" 
          element={<ProtectedRoute requiredAccess="/upload-massal-regional2s"><UploadMassalPertamina2S /></ProtectedRoute>} />

          {/* Pertamina Regional 2 Zona 7 DEVPLAN routes */}
        <Route path="/regional2z7d-edit" 
          element={<ProtectedRoute requiredAccess="/regional2z7d-edit"><Pertamina2Z7DEditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-regional2z7d" 
          element={<ProtectedRoute requiredAccess="/nonactive-regional2z7d"><Pertamina2Z7DNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-regional2z7d" 
          element={<ProtectedRoute requiredAccess="/tambah-user-regional2z7d"><TambahUserPertamina2Z7D /></ProtectedRoute>} />
        <Route path="/upload-massal-regional2z7d" 
          element={<ProtectedRoute requiredAccess="/upload-massal-regional2z7d"><UploadMassalPertamina2Z7D /></ProtectedRoute>} />

          {/* Pertamina Regional 2 Zona 7 WOPDM routes */}
        <Route path="/regional2z7w-edit" 
          element={<ProtectedRoute requiredAccess="/regional2z7w-edit"><Pertamina2Z7WEditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-regional2z7w" 
          element={<ProtectedRoute requiredAccess="/nonactive-regional2z7w"><Pertamina2Z7WNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-regional2z7w" 
          element={<ProtectedRoute requiredAccess="/tambah-user-regional2z7w"><TambahUserPertamina2Z7W /></ProtectedRoute>} />
        <Route path="/upload-massal-regional2z7w" 
          element={<ProtectedRoute requiredAccess="/upload-massal-regional2z7w"><UploadMassalPertamina2Z7W /></ProtectedRoute>} />

          {/* Umran routes */}
        <Route path="/umran-edit" 
          element={<ProtectedRoute requiredAccess="/umran-edit"><UmranEditProjectPage /></ProtectedRoute>} />
        <Route path="/nonactive-umran" 
          element={<ProtectedRoute requiredAccess="/nonactive-umran"><UmranNAProjectPage /></ProtectedRoute>} />
        <Route path="/tambah-user-umran" 
          element={<ProtectedRoute requiredAccess="/tambah-user-umran"><TambahUserUmran /></ProtectedRoute>} />
        <Route path="/upload-massal-umran" 
          element={<ProtectedRoute requiredAccess="/upload-massal-umran"><UploadMassalUmran /></ProtectedRoute>} />

        //hse

        <Route path="/hse-tar" 
          element={<ProtectedRoute requiredAccess="/hse-tar"><TarHSEPage /></ProtectedRoute>} />

        <Route path="/hse-elnusa" 
          element={<ProtectedRoute requiredAccess="/hse-elnusa"><ElnusaHSEPage /></ProtectedRoute>} />
        <Route path="/hse-elnusa-form/:id" 
          element={<ProtectedRoute requiredAccess="hse-elnusa-form"><FormElnusaHSEEdit /></ProtectedRoute>} />

        <Route path="/hse-regional4" 
          element={<ProtectedRoute requiredAccess="/hse-regional4"><Regional4HSEPage /></ProtectedRoute>} />
        <Route path="/hse-regional4-form/:id" 
          element={<ProtectedRoute requiredAccess="/hse-regional4-form"><FormRegional4HSEEdit /></ProtectedRoute>} />

        <Route path="/hse-regional2x" 
          element={<ProtectedRoute requiredAccess="/hse-regional2x"><Regional2XHSEPage /></ProtectedRoute>} />
        <Route path="/hse-regional2x-form/:id" 
          element={<ProtectedRoute requiredAccess="/hse-regional2x-form"><FormRegional2XHSEEdit /></ProtectedRoute>} />

        <Route path="/hse-regional2s" 
          element={<ProtectedRoute requiredAccess="/hse-regional2s"><Regional2SHSEPage /></ProtectedRoute>} />
        <Route path="/hse-regional2s-form/:id" 
          element={<ProtectedRoute requiredAccess="/hse-regional2s-form"><FormRegional2SHSEEdit /></ProtectedRoute>} />

        <Route path="/hse-regional2z7d" 
          element={<ProtectedRoute requiredAccess="/hse-regional2z7d"><Regional2Z7DHSEPage /></ProtectedRoute>} />
        <Route path="/hse-regional2z7d-form/:id" 
          element={<ProtectedRoute requiredAccess="/hse-regional2z7d-form"><FormRegional2Z7DHSEEdit /></ProtectedRoute>} />

        <Route path="/hse-regional2z7w" 
          element={<ProtectedRoute requiredAccess="/hse-regional2z7w"><Regional2Z7WHSEPage /></ProtectedRoute>} />
        <Route path="/hse-regional2z7w-form/:id" 
          element={<ProtectedRoute requiredAccess="/hse-regional2z7w-form"><FormRegional2Z7WHSEEdit /></ProtectedRoute>} />

        {/* Pertamina routes dan lainnya... */}
        
        {/* Management routes */}
        <Route path="/add-management" 
          element={<ProtectedRoute requiredAccess="/management-edit"><AddManagementPage /></ProtectedRoute>} />
        <Route path="/add-management/:id" 
          element={<ProtectedRoute requiredAccess="/management-edit"><AddManagementPage /></ProtectedRoute>} />
        <Route path="/management-edit" 
          element={<ProtectedRoute requiredAccess="/management-edit"><EditManagementPage /></ProtectedRoute>} />
      
      {/* ACCOUNT routes */}
        <Route path="/admin-account" 
          element={<ProtectedRoute requiredAccess="/admin-account"><AccountEditMA /></ProtectedRoute>} />
        <Route path="/user-account" 
          element={<ProtectedRoute requiredAccess="/user-account"><AccountEditUser /></ProtectedRoute>} />
      </Route>

      {/* Rute tidak dikenal - Redirect ke login */}
      <Route path="*" element={<Navigate to="/log-user" replace />} />
      
    </Routes>
  );
}

export default App
