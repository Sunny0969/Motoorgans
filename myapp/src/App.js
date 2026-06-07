// // src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';

// // Components (Header, HeroSection, ExitPage)
// import Header from './components/Header';
// import HeroSection from './components/HeroSection';
// import ExitPage from './pages/ExitPage';

// // Pages
// import ChartOfAccounts from './pages/ChartOfAccounts';
// import PurchaseForm from './pages/PurchaseForm';
// import FinancialStatementLevels from './pages/FinancialStatementLevels';
// import ClassTransactionLevels from './pages/ClassTransactionLevels';
// import GroupAccountsLevels from './pages/GroupAccountsLevels';
// import ChartOfLocations from './pages/ChartOfLocations';
// import ChartOfProducts from './pages/ChartOfProducts';
// import BillOfMaterial from './pages/BillOfMaterial';
// import ChartOfEmployee from './pages/ChartOfEmployee';
// import SystemPreferences from './pages/SystemPreferences';

// // Vouchers
// import PaymentVoucher from './pages/PaymentVoucher';
// import ReceiptVoucher from './pages/ReceiptVoucher';
// import JournalVoucher from './pages/JournalVoucher';
// import ContraVoucher from './pages/ContraVoucher';
// import PurchaseVoucher from './pages/PurchaseVoucher';
// import SalesVoucher from './pages/SalesVoucher';
// import CreditNote from './pages/CreditNote';
// import DebitNote from './pages/DebitNote';

// // Reports
// import ReportPage from './pages/ReportPage';

// // Final Accounts
// import TradingAccount from './pages/TradingAccount';
// import ProfitLossAccount from './pages/ProfitLossAccount';
// import BalanceSheet from './pages/BalanceSheet';
// import CashFlowStatement from './pages/CashFlowStatement';
// import FundFlowStatement from './pages/FundFlowStatement';
// import ManufacturingAccount from './pages/ManufacturingAccount';
// import ConsolidatedAccounts from './pages/ConsolidatedAccounts';
// import YearEndClosing from './pages/YearEndClosing';

// // Tools
// import BackupDatabase from './pages/BackupDatabase';
// import RestoreDatabase from './pages/RestoreDatabase';
// import ImportData from './pages/ImportData';
// import ExportData from './pages/ExportData';
// import Calculator from './pages/Calculator';
// import DataCleanup from './pages/DataCleanup';
// import SecuritySettings from './pages/SecuritySettings';
// import SystemMaintenance from './pages/SystemMaintenance';

// // SMS
// import SendSMS from './pages/SendSMS';
// import SMSTemplates from './pages/SMSTemplates';
// import SMSHistory from './pages/SMSHistory';
// import BulkSMS from './pages/BulkSMS';
// import SMSSettings from './pages/SMSSettings';
// import ContactGroups from './pages/ContactGroups';
// import SMSReports from './pages/SMSReports';
// import SMSBalance from './pages/SMSBalance';

// // Windows
// import WindowsPage from './pages/WindowsPage';

// // Help
// import UserManual from './pages/UserManual';
// import VideoTutorials from './pages/VideoTutorials';
// import FAQs from './pages/FAQs';
// import ContactSupport from './pages/ContactSupport';
// import CheckUpdates from './pages/CheckUpdates';
// import AboutSoftware from './pages/AboutSoftware';
// import LicenseInfo from './pages/LicenseInfo';
// import ReportBug from './pages/ReportBug';

// // Button Menu Pages
// import SaleOrder from './pages/SaleOrder';
// import Sale from './pages/Sale';
// import CashReceipt from './pages/CashReceipt';
// import CashPayment from './pages/CashPayment';
import GeneralLedgers from './pages/GeneralLedgers';
// import TrialBalance from './pages/TrialBalance';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Exit Route - NO HEADER */}
//         <Route path="/exit" element={<ExitPage />} />
        
//         {/* Home Route */}
//         <Route 
//           path="/" 
//           element={
//             <>
//               <Header />
//               <HeroSection />
//             </>
//           } 
//         />

//         {/* ========== DEFINE MENU ROUTES ========== */}
//         <Route path="/define/financial-statement-levels" element={<FinancialStatementLevels />} />
//         <Route path="/define/class-of-transaction-levels" element={<ClassTransactionLevels />} />
//         <Route path="/define/group-of-accounts-levels" element={<GroupAccountsLevels />} />
//         <Route path="/define/chart-of-accounts" element={<ChartOfAccounts />} />
//         <Route path="/define/chart-of-locations" element={<ChartOfLocations />} />
//         <Route path="/define/chart-of-products" element={<ChartOfProducts />} />
//         <Route path="/define/bill-of-material" element={<BillOfMaterial />} />
//         <Route path="/define/chart-of-employee" element={<ChartOfEmployee />} />
//         <Route path="/define/system-preferences" element={<SystemPreferences />} />

//         {/* ========== VOUCHERS MENU ROUTES ========== */}
//         <Route path="/vouchers/payment-voucher" element={<PaymentVoucher />} />
//         <Route path="/vouchers/receipt-voucher" element={<ReceiptVoucher />} />
//         <Route path="/vouchers/journal-voucher" element={<JournalVoucher />} />
//         <Route path="/vouchers/contra-voucher" element={<ContraVoucher />} />
//         <Route path="/vouchers/purchase-voucher" element={<PurchaseVoucher />} />
//         <Route path="/vouchers/sales-voucher" element={<SalesVoucher />} />
//         <Route path="/vouchers/credit-note" element={<CreditNote />} />
//         <Route path="/vouchers/debit-note" element={<DebitNote />} />

//         {/* ========== REPORTS MENU ROUTES ========== */}
//         <Route path="/reports/shop-list" element={<ReportPage title="Shop List" />} />
//         <Route path="/reports/chart-of-accounts" element={<ReportPage title="Chart of Accounts Report" />} />
//         <Route path="/reports/chart-of-accounts-urdu" element={<ReportPage title="Chart of Accounts Urdu" />} />
//         <Route path="/reports/chart-of-products" element={<ReportPage title="Chart of Products Report" />} />
//         <Route path="/reports/chart-of-products-urdu" element={<ReportPage title="Chart of Products Urdu" />} />
//         <Route path="/reports/rate-list" element={<ReportPage title="Rate List" />} />
//         <Route path="/reports/d.o" element={<ReportPage title="D.O Report" />} />
//         <Route path="/reports/p.o" element={<ReportPage title="P.O Report" />} />
//         <Route path="/reports/purchase" element={<ReportPage title="Purchase Report" />} />
//         <Route path="/reports/purchase-return" element={<ReportPage title="Purchase Return Report" />} />
//         <Route path="/reports/sale-order" element={<ReportPage title="Sale Order Report" />} />
//         <Route path="/reports/sales" element={<ReportPage title="Sales Report" />} />
//         <Route path="/reports/sales-return" element={<ReportPage title="Sales Return Report" />} />
//         <Route path="/reports/stock" element={<ReportPage title="Stock Report" />} />
//         <Route path="/reports/cash-receipt" element={<ReportPage title="Cash Receipt Report" />} />
//         <Route path="/reports/cash-payment" element={<ReportPage title="Cash Payment Report" />} />
//         <Route path="/reports/bank-deposit" element={<ReportPage title="Bank Deposit Report" />} />
//         <Route path="/reports/bank-payments" element={<ReportPage title="Bank Payments Report" />} />
//         <Route path="/reports/journal-voucher" element={<ReportPage title="Journal Voucher Report" />} />
//         <Route path="/reports/salary-sheet" element={<ReportPage title="Salary Sheet" />} />
//         <Route path="/reports/expenses" element={<ReportPage title="Expenses Report" />} />
//         <Route path="/reports/account-payable---receivable" element={<ReportPage title="Account Payable / Receivable" />} />
//         <Route path="/reports/monthly-transaction-report" element={<ReportPage title="Monthly Transaction Report" />} />
//         <Route path="/reports/account-activity-report" element={<ReportPage title="Account Activity Report" />} />
//         <Route path="/reports/account-status-report" element={<ReportPage title="Account Status Report" />} />
//         <Route path="/reports/general-ledgers" element={<ReportPage title="General Ledgers Report" />} />

//         {/* ========== FINAL ACCOUNTS MENU ROUTES ========== */}
//         <Route path="/final-accounts/trading-account" element={<TradingAccount />} />
//         <Route path="/final-accounts/profit-and-loss-account" element={<ProfitLossAccount />} />
//         <Route path="/final-accounts/balance-sheet" element={<BalanceSheet />} />
//         <Route path="/final-accounts/cash-flow-statement" element={<CashFlowStatement />} />
//         <Route path="/final-accounts/fund-flow-statement" element={<FundFlowStatement />} />
//         <Route path="/final-accounts/manufacturing-account" element={<ManufacturingAccount />} />
//         <Route path="/final-accounts/consolidated-accounts" element={<ConsolidatedAccounts />} />
//         <Route path="/final-accounts/year-end-closing" element={<YearEndClosing />} />

//         {/* ========== TOOLS MENU ROUTES ========== */}
//         <Route path="/tools/backup-database" element={<BackupDatabase />} />
//         <Route path="/tools/restore-database" element={<RestoreDatabase />} />
//         <Route path="/tools/import-data" element={<ImportData />} />
//         <Route path="/tools/export-data" element={<ExportData />} />
//         <Route path="/tools/calculator" element={<Calculator />} />
//         <Route path="/tools/data-cleanup" element={<DataCleanup />} />
//         <Route path="/tools/security-settings" element={<SecuritySettings />} />
//         <Route path="/tools/system-maintenance" element={<SystemMaintenance />} />

//         {/* ========== SMS MENU ROUTES ========== */}
//         <Route path="/sms/send-sms" element={<SendSMS />} />
//         <Route path="/sms/sms-templates" element={<SMSTemplates />} />
//         <Route path="/sms/sms-history" element={<SMSHistory />} />
//         <Route path="/sms/bulk-sms" element={<BulkSMS />} />
//         <Route path="/sms/sms-settings" element={<SMSSettings />} />
//         <Route path="/sms/contact-groups" element={<ContactGroups />} />
//         <Route path="/sms/sms-reports" element={<SMSReports />} />
//         <Route path="/sms/sms-balance" element={<SMSBalance />} />

//         {/* ========== WINDOWS MENU ROUTES ========== */}
//         <Route path="/windows/cascade-windows" element={<WindowsPage title="Cascade Windows" />} />
//         <Route path="/windows/tile-horizontal" element={<WindowsPage title="Tile Horizontal" />} />
//         <Route path="/windows/tile-vertical" element={<WindowsPage title="Tile Vertical" />} />
//         <Route path="/windows/close-all" element={<WindowsPage title="Close All" />} />
//         <Route path="/windows/minimize-all" element={<WindowsPage title="Minimize All" />} />
//         <Route path="/windows/restore-all" element={<WindowsPage title="Restore All" />} />
//         <Route path="/windows/switch-window" element={<WindowsPage title="Switch Window" />} />
//         <Route path="/windows/window-list" element={<WindowsPage title="Window List" />} />

//         {/* ========== HELP MENU ROUTES ========== */}
//         <Route path="/help/user-manual" element={<UserManual />} />
//         <Route path="/help/video-tutorials" element={<VideoTutorials />} />
//         <Route path="/help/faqs" element={<FAQs />} />
//         <Route path="/help/contact-support" element={<ContactSupport />} />
//         <Route path="/help/check-updates" element={<CheckUpdates />} />
//         <Route path="/help/about-software" element={<AboutSoftware />} />
//         <Route path="/help/license-info" element={<LicenseInfo />} />
//         <Route path="/help/report-bug" element={<ReportBug />} />

//         {/* ========== BUTTON MENU ROUTES ========== */}
//         <Route path="/page/chart-of-accounts" element={<ChartOfAccounts />} />
//         <Route path="/page/purchase" element={<PurchaseForm />} />
//         <Route path="/page/sale-order" element={<SaleOrder />} />
//         <Route path="/page/sale" element={<Sale />} />
//         <Route path="/page/cash-receipt" element={<CashReceipt />} />
//         <Route path="/page/cash-payment" element={<CashPayment />} />
//         <Route path="/page/journal-voucher" element={<JournalVoucher />} />
//         <Route path="/page/general-ledgers" element={<GeneralLedgers />} />
//         <Route path="/page/trial-balance" element={<TrialBalance />} />

//         {/* 404 - Redirect to Home */}
//         <Route path="*" element={<HeroSection />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;



// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Components (Header, HeroSection, ExitPage)
import Header from './components/Header';
import ExitPage from './pages/ExitPage';

// Pages
import ChartOfAccounts from './pages/ChartOfAccounts';
import PurchaseForm from './pages/PurchaseForm';
import FinancialStatementLevels from './pages/FinancialStatementLevels';
import ClassTransactionLevels from './pages/ClassTransactionLevels';
import GroupAccountsLevels from './pages/GroupAccountsLevels';
import ChartOfLocations from './pages/ChartOfLocations';
import ProductsPage from './pages/ProductsPage';
import BillOfMaterial from './pages/BillOfMaterial';
import ChartOfEmployee from './pages/ChartOfEmployee';
import SystemPreferences from './pages/SystemPreferences';

// Vouchers
import DemandOrder from './pages/DemandOrder'
import OpeningStock from './pages/OpeningStock';
import JournalVoucher from './pages/JournalVoucher';
import StockTransfer from './pages/StockTransfer';
import StockAdjustment from './pages/StockAdjustment';
import Production from './pages/Production';
import PurchaseOrder from './pages/PurchaseOrder';
// import Purchase from './pages/Purchase';
import PurchaseReturn from './pages/PurchaseReturn';
import ClaimOutToSuppliers from './pages/ClaimOutToSuppliers';
import SaleOrder from './pages/SaleOrder';
import Sale from './pages/Sale';
import SaleReturn from './pages/SalesReturn';
import ClaimInFromCustomer from './pages/ClaimInFromCustomer';
import Exchange from './pages/Exchange';
import CashReceipt from './pages/CashReceipt';
import CashPayment from './pages/CashPayment';
import BankReceipt from './pages/BankReceipt';
import BankPayment from './pages/BankPayment';
import ChequeTransfer from './pages/ChequeTransfer';
import SalarySlip from './pages/SalarySlip';

// Reports
import ReportPage from './pages/ReportPage';
import ChartsOfProductsUrdu from './pages/ChartOfProductsUrdu';


// Final Accounts

import CashFlowStatement from './pages/CashFlowStatement';
import FundFlowStatement from './pages/FundFlowStatement';
import ManufacturingAccount from './pages/ManufacturingAccount';
import ConsolidatedAccounts from './pages/ConsolidatedAccounts';
import YearEndClosing from './pages/YearEndClosing';

// Tools
import DayClose from './pages/DayClose';
import UserPermission from './pages/UserPermission';
import CreateBackup from './pages/CreateBackup';
import RestoreBackup from './pages/RestoreBackup';
import ClearData from './pages/ClearData';
import ChangeFont from './pages/ChangeFont';
import ChangeFontColor from './pages/ChangeFontColor';
import Login from './pages/Login';
import EventsLogReports from './pages/EventsLogReports';
import MainPageSetting from './pages/MainPageSetting';

// SMS
import SendSMS from './pages/SendSMS';

import SMSHistory from './pages/SMSHistory';

import SMSSettings from './pages/SMSSettings';
import ContactGroups from './pages/ContactGroups';
import SMSReports from './pages/SMSReports';
import SMSBalance from './pages/SMSBalance';

// Windows
import WindowsPage from './pages/WindowsPage';

// Help
import UserManual from './pages/UserManual';
import VideoTutorials from './pages/VideoTutorials';
import FAQs from './pages/FAQs';
import ContactSupport from './pages/ContactSupport';
import CheckUpdates from './pages/CheckUpdates';
import AboutSoftware from './pages/AboutSoftware';
import LicenseInfo from './pages/LicenseInfo';
import ReportBug from './pages/ReportBug';

// Button Menu Pages




import ShopList from './pages/ShopList';
import ChartsOfAccountsUrdu from './pages/ChartsOfAccountsUrdu';
import RateList from './pages/RateList';
import AccountsPage from './pages/AccountsPage';
import MonthlyTransactionReport from './pages/MonthlyTransactionReport';
import AccountActivityReport from './pages/AccountActivityReport';
import AccountStatusReport from './pages/AccountStatusReport';
import ExpensesPage from './pages/ExpensesPage';
import StockManagement from './pages/StockManegement';
import TempPnLPage from './pages/TempPnLPage';
import TrialBalanceSpo from './pages/TrialBalanceSpo';
import Configuration from './pages/Configuration';
import BulkSMSPage from './pages/BulkSMSPage';
import CustomerDetails from './pages/CustomerDetails';
import ProductHistory from './pages/ProductHistory';
import GlobalShortcuts from './components/GlobalShortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import PSDetailPage from './pages/PSDetailPage';
import StockModule from './pages/StockModule';
import LedgerModule from './pages/LedgerModule';
import SalesInvoiceList from './pages/SalesInvoiceList';
import TempAcBalPage from './pages/TempAcBalPage';
import TempLedgerPage from './pages/TempLedgerPage';
import CompanyPage from './pages/CompanyPage';
import TrialBalancePage from './pages/TrialBalancePage';

function LoginGate() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Login />;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <GlobalShortcuts />
      <Header />
      <Outlet />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/tools/login" element={<LoginGate />} />
        <Route path="/exit" element={<ExitPage />} />

        <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/define/financial-statement-levels" element={<FinancialStatementLevels />} />
        <Route path="/define/class-of-transaction-levels" element={<ClassTransactionLevels />} />
        <Route path="/define/group-of-accounts-levels" element={<GroupAccountsLevels />} />
        <Route path="/define/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/define/chart-of-locations" element={<ChartOfLocations />} />
        <Route path="/define/chart-of-products" element={<ProductsPage />} />
        <Route path="/define/company" element={<CompanyPage />} />
        <Route path="/define/bill-of-material" element={<BillOfMaterial />} />
        <Route path="/define/chart-of-employee" element={<ChartOfEmployee />} />
        <Route path="/define/system-preferences" element={<SystemPreferences />} />

        {/* ========== VOUCHERS MENU ROUTES ========== */}
         {/* New Voucher Routes */}
        <Route path="/vouchers/demand-order" element={<DemandOrder />} />
        <Route path="/vouchers/opening-stock" element={<OpeningStock />} />
        <Route path="/vouchers/stock-transfer" element={<StockTransfer />} />
        <Route path="/vouchers/stock-adjustment" element={<StockAdjustment />} />
        <Route path="/vouchers/production" element={<Production />} />
        <Route path="/vouchers/purchase-order" element={<PurchaseOrder />} />
        <Route path="/vouchers/purchase" element={<PurchaseForm />} />
        <Route path="/vouchers/purchase-return" element={<PurchaseReturn />} />
        <Route path="/vouchers/claim-out-to-suppliers" element={<ClaimOutToSuppliers />} />
        <Route path="/vouchers/sale-order" element={<SaleOrder />} />
        <Route path="/vouchers/sale" element={<Sale />} />
        <Route path="/vouchers/sale-return" element={<SaleReturn />} />
        <Route path="/vouchers/claim-in-from-customer" element={<ClaimInFromCustomer />} />
        <Route path="/vouchers/exchange" element={<Exchange />} />
        <Route path="/vouchers/cash-reciept" element={<CashReceipt />} />
        <Route path="/vouchers/cash-payment" element={<CashPayment />} />
        <Route path="/vouchers/bank-receipt" element={<BankReceipt />} />
        <Route path="/vouchers/bank-reciept" element={<BankReceipt />} />
        <Route path="/vouchers/bank-payment" element={<BankPayment />} />
        <Route path="/vouchers/cheque-transfer" element={<ChequeTransfer />} />
        <Route path="/vouchers/salary-slip" element={<SalarySlip />} />
        <Route path="/vouchers/journal-voucher" element={<JournalVoucher />} />

        {/* ========== REPORTS MENU ROUTES ========== */}
        <Route path="/reports/shop-list" element={<ShopList />} />
        <Route path="/reports/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/reports/chart-of-accounts-urdu" element={<ChartsOfAccountsUrdu />} />
        <Route path="/reports/chart-of-products" element={<ProductsPage />} />
        <Route path="/reports/chart-of-products-urdu" element={<ChartsOfProductsUrdu />} />
        <Route path="/reports/rate-list" element={<RateList />} />
        <Route path="/reports/d-o" element={<ReportPage title="D.O Report" />} />
        <Route path="/reports/p-o" element={<ReportPage title="P.O Report" />} />
        <Route path="/reports/purchase" element={<PurchaseForm />} />
        <Route path="/reports/purchase-return" element={<PurchaseReturn />} />
        <Route path="/reports/sale-order" element={<SaleOrder />} />
        <Route path="/reports/sales" element={<Sale />} />
        <Route path="/reports/sales-return" element={<SaleReturn />} />
        <Route path="/reports/stock" element={<StockModule />} />
        <Route path="/reports/cash-receipt" element={<CashReceipt />} />
        <Route path="/reports/cash-payment" element={<CashPayment />} />
        <Route path="/reports/bank-deposit" element={<ReportPage title="Bank Deposit Report" />} />
        <Route path="/reports/bank-payments" element={<BankPayment />} />
        <Route path="/reports/journal-voucher" element={<JournalVoucher />} />
        <Route path="/reports/salary-sheet" element={<SalarySlip />} />
        <Route path="/reports/expenses" element={<ExpensesPage />} />
        <Route path="/reports/account-payable---receivable" element={<AccountsPage />} />
        <Route path="/reports/monthly-transaction-report" element={<MonthlyTransactionReport />} />
        <Route path="/reports/account-activity-report" element={<AccountActivityReport />} />
        <Route path="/reports/account-status-report" element={<AccountStatusReport />} />
        <Route path="/reports/general-ledgers" element={<TempLedgerPage />} />
        <Route path="/reports/customer-details" element={<CustomerDetails />} />
        <Route path="/reports/items" element={<ProductsPage />} />
        <Route path="/reports/product-history" element={<ProductHistory />} />
        <Route path="/reports/ps-detail" element={<PSDetailPage />} />
        <Route path="/reports/ledger" element={<LedgerModule />} />
        <Route path="/reports/sales-invoice" element={<SalesInvoiceList />} />
        <Route path="/page/customer-details" element={<CustomerDetails />} />
        <Route path="/page/items" element={<ProductsPage />} />
        <Route path="/page/product-history" element={<ProductHistory />} />
        <Route path="/page/ps-detail" element={<PSDetailPage />} />
        <Route path="/page/ledger" element={<LedgerModule />} />
        <Route path="/page/sales-invoice" element={<SalesInvoiceList />} />
        <Route path="/page/stock" element={<StockModule />} />
        <Route path="/page/companies" element={<CompanyPage />} />

        {/* ========== FINAL ACCOUNTS MENU ROUTES ========== */}
        <Route path="/final-accounts/trail-balance" element={<TempAcBalPage />} />
        <Route path="/final-accounts/profit-loss" element={<TempPnLPage />} />
        <Route path="/page/temp-pnl" element={<TempPnLPage />} />
        <Route path="/final-accounts/trial-balance-spo-wise" element={<TrialBalanceSpo />} />
        <Route path="/final-accounts/cash-flow-statement" element={<CashFlowStatement />} />
        <Route path="/final-accounts/fund-flow-statement" element={<FundFlowStatement />} />
        <Route path="/final-accounts/manufacturing-account" element={<ManufacturingAccount />} />
        <Route path="/final-accounts/consolidated-accounts" element={<ConsolidatedAccounts />} />
        <Route path="/final-accounts/statement-of-final-position" element={<YearEndClosing />} />

        {/* ========== TOOLS MENU ROUTES ========== */}
        <Route path="/tools/day-close" element={<DayClose />} />
        <Route path="/tools/user-permission" element={<UserPermission />} />
        <Route path="/tools/create-backup" element={<CreateBackup />} />
        <Route path="/tools/restore-backup" element={<RestoreBackup />} />
        <Route path="/tools/clear-data" element={<ClearData />} />
        <Route path="/tools/change-font" element={<ChangeFont />} />
        <Route path="/tools/change-font-color" element={<ChangeFontColor />} />
        <Route path="/tools/events-log-reports" element={<EventsLogReports />} />
        <Route path="/tools/main-page-setting" element={<MainPageSetting />} />

        {/* ========== SMS MENU ROUTES ========== */}
        <Route path="/sms/send-sms" element={<SendSMS />} />
        <Route path="/sms/configurations" element={<Configuration />} />
        <Route path="/sms/sms-history" element={<SMSHistory />} />
        <Route path="/sms/bulk-sms" element={<BulkSMSPage />} />
        <Route path="/sms/sms-settings" element={<SMSSettings />} />
        <Route path="/sms/contact-groups" element={<ContactGroups />} />
        <Route path="/sms/sms-reports" element={<SMSReports />} />
        <Route path="/sms/sms-balance" element={<SMSBalance />} />

        {/* ========== WINDOWS MENU ROUTES ========== */}
        <Route path="/windows/cascade-windows" element={<WindowsPage title="Cascade Windows" />} />
        <Route path="/windows/tile-horizontal" element={<WindowsPage title="Tile Horizontal" />} />
        <Route path="/windows/tile-vertical" element={<WindowsPage title="Tile Vertical" />} />
        <Route path="/windows/close-all" element={<WindowsPage title="Close All" />} />
        <Route path="/windows/minimize-all" element={<WindowsPage title="Minimize All" />} />
        <Route path="/windows/restore-all" element={<WindowsPage title="Restore All" />} />
        <Route path="/windows/switch-window" element={<WindowsPage title="Switch Window" />} />
        <Route path="/windows/window-list" element={<WindowsPage title="Window List" />} />

        {/* ========== HELP MENU ROUTES ========== */}
        <Route path="/help/user-manual" element={<UserManual />} />
        <Route path="/help/video-tutorials" element={<VideoTutorials />} />
        <Route path="/help/faqs" element={<FAQs />} />
        <Route path="/help/contact-support" element={<ContactSupport />} />
        <Route path="/help/check-updates" element={<CheckUpdates />} />
        <Route path="/help/about-software" element={<AboutSoftware />} />
        <Route path="/help/license-info" element={<LicenseInfo />} />
        <Route path="/help/report-bug" element={<ReportBug />} />

        {/* ========== BUTTON MENU ROUTES ========== */}
        <Route path="/page/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/page/purchase" element={<PurchaseForm />} />
        <Route path="/page/sale-order" element={<SaleOrder />} />
        <Route path="/page/sale" element={<Sale />} />
        <Route path="/page/cash-receipt" element={<CashReceipt />} />
        <Route path="/page/cash-payment" element={<CashPayment />} />
        <Route path="/page/journal-voucher" element={<JournalVoucher />} />
        <Route path="/page/general-ledgers" element={<GeneralLedgers />} />
        <Route path="/page/temp-ledger" element={<TempLedgerPage />} />
        <Route path="/page/trial-balance" element={<TrialBalancePage />} />
        <Route path="/page/temp-acbal" element={<TempAcBalPage />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;