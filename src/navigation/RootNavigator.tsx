import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import TabNavigator from './TabNavigator';

// Auth
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import GetStartedScreen from '../screens/auth/GetStartedScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';
import SyncTallyScreen from '../screens/auth/SyncTallyScreen';
import PairTallyScreen from '../screens/auth/PairTallyScreen';
import PairingProgressScreen from '../screens/auth/PairingProgressScreen';

// Stack screens (accessible from tabs)
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import CashInHandScreen from '../screens/cash/CashInHandScreen';
import BankBalanceScreen from '../screens/bank/BankBalanceScreen';
import BankAccountDetailScreen from '../screens/bank/BankAccountDetailScreen';
import ReceivablesScreen from '../screens/receivables/ReceivablesScreen';
import PayablesScreen from '../screens/payables/PayablesScreen';
import LoansODsScreen from '../screens/loans/LoansODsScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import ReceiptsScreen from '../screens/payments/ReceiptsScreen';
import SalesRegisterScreen from '../screens/sales/SalesRegisterScreen';
import PurchaseRegisterScreen from '../screens/purchase/PurchaseRegisterScreen';
import EWayBillsScreen from '../screens/sales/EWayBillsScreen';
import LedgerDetailScreen from '../screens/ledger/LedgerDetailScreen';
import InvoiceDetailScreen from '../screens/sales/InvoiceDetailScreen';

// Create flows
import CreateSalesInvoiceScreen from '../screens/create/CreateSalesInvoiceScreen';
import CreatePurchaseInvoiceScreen from '../screens/create/CreatePurchaseInvoiceScreen';
import CreateSalesOrderScreen from '../screens/create/CreateSalesOrderScreen';
import CreatePurchaseOrderScreen from '../screens/create/CreatePurchaseOrderScreen';
import CreateQuotationScreen from '../screens/create/CreateQuotationScreen';
import CreateCreditNoteScreen from '../screens/create/CreateCreditNoteScreen';
import CreateDebitNoteScreen from '../screens/create/CreateDebitNoteScreen';
import CreateDeliveryNoteScreen from '../screens/create/CreateDeliveryNoteScreen';
import CreateVoucherScreen from '../screens/create/CreateVoucherScreen';
import CreatePartyScreen from '../screens/create/CreatePartyScreen';
import CreateProductScreen from '../screens/create/CreateProductScreen';

// Stock flows
import StockItemDetailScreen from '../screens/stocks/StockItemDetailScreen';
import StockTransferScreen from '../screens/stocks/StockTransferScreen';
import StockAdjustScreen from '../screens/stocks/StockAdjustScreen';
import StockAddItemScreen from '../screens/stocks/StockAddItemScreen';
import StockBulkTransferScreen from '../screens/stocks/StockBulkTransferScreen';
import WarehouseDetailScreen from '../screens/stocks/WarehouseDetailScreen';

// Integration screens
import EWayBillIntegrationScreen from '../screens/settings/EWayBillIntegrationScreen';
import EInvoiceIntegrationScreen from '../screens/settings/EInvoiceIntegrationScreen';

// Report flows
import FinancialScreen from '../screens/reports/FinancialScreen';
import ComplianceScreen from '../screens/reports/ComplianceScreen';
import AuditTrailScreen from '../screens/reports/AuditTrailScreen';
import AIInsightsScreen from '../screens/reports/AIInsightsScreen';
import GSTFilingScreen from '../screens/reports/GSTFilingScreen';
import UnmatchedListScreen from '../screens/reports/UnmatchedListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator({ initialRoute }: { initialRoute: keyof RootStackParamList }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {/* Auth */}
      <Stack.Screen name="Splash"           component={SplashScreen} />
      <Stack.Screen name="Auth"             component={LoginScreen} />
      <Stack.Screen name="Login"            component={LoginScreen} />
      <Stack.Screen name="OTP"              component={OTPScreen} />
      <Stack.Screen name="GetStarted"       component={GetStartedScreen} />
      <Stack.Screen name="Terms"            component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy"    component={PrivacyPolicyScreen} />
      <Stack.Screen name="SyncTally"        component={SyncTallyScreen} />
      <Stack.Screen name="PairTally"        component={PairTallyScreen} />
      <Stack.Screen name="PairingProgress"  component={PairingProgressScreen} />

      {/* Main */}
      <Stack.Screen name="MainTabs"         component={TabNavigator} />

      {/* Stack screens */}
      <Stack.Screen name="Notifications"    component={NotificationsScreen} />
      <Stack.Screen name="Settings"         component={SettingsScreen} />
      <Stack.Screen name="CashInHand"       component={CashInHandScreen} />
      <Stack.Screen name="BankBalance"      component={BankBalanceScreen} />
      <Stack.Screen name="BankAccountDetail"component={BankAccountDetailScreen} />
      <Stack.Screen name="Receivables"      component={ReceivablesScreen} />
      <Stack.Screen name="Payables"         component={PayablesScreen} />
      <Stack.Screen name="LoansODs"         component={LoansODsScreen} />
      <Stack.Screen name="Payments"         component={PaymentsScreen} />
      <Stack.Screen name="Receipts"         component={ReceiptsScreen} />
      <Stack.Screen name="SalesRegister"    component={SalesRegisterScreen} />
      <Stack.Screen name="PurchaseRegister" component={PurchaseRegisterScreen} />
      <Stack.Screen name="EWayBills"        component={EWayBillsScreen} />
      <Stack.Screen name="LedgerDetail"     component={LedgerDetailScreen} />
      <Stack.Screen name="InvoiceDetail"    component={InvoiceDetailScreen} />
      <Stack.Screen name="VoucherDetail"    component={InvoiceDetailScreen} />

      {/* Create flows */}
      <Stack.Screen name="CreateSalesInvoice"   component={CreateSalesInvoiceScreen} />
      <Stack.Screen name="CreatePurchaseInvoice" component={CreatePurchaseInvoiceScreen} />
      <Stack.Screen name="CreateSalesOrder"     component={CreateSalesOrderScreen} />
      <Stack.Screen name="CreatePurchaseOrder"  component={CreatePurchaseOrderScreen} />
      <Stack.Screen name="CreateQuotation"      component={CreateQuotationScreen} />
      <Stack.Screen name="CreateCreditNote"     component={CreateCreditNoteScreen} />
      <Stack.Screen name="CreateDebitNote"      component={CreateDebitNoteScreen} />
      <Stack.Screen name="CreateDeliveryNote"   component={CreateDeliveryNoteScreen} />
      <Stack.Screen name="CreateVoucher"        component={CreateVoucherScreen} />
      <Stack.Screen name="CreateParty"          component={CreatePartyScreen} />
      <Stack.Screen name="CreateProduct"        component={CreateProductScreen} />

      {/* Stock flows */}
      <Stack.Screen name="StockItemDetail"   component={StockItemDetailScreen} />
      <Stack.Screen name="StockTransfer"     component={StockTransferScreen} />
      <Stack.Screen name="StockAdjust"       component={StockAdjustScreen} />
      <Stack.Screen name="StockAddItem"      component={StockAddItemScreen} />
      <Stack.Screen name="StockBulkTransfer" component={StockBulkTransferScreen} />
      <Stack.Screen name="WarehouseDetail"   component={WarehouseDetailScreen} />

      {/* Integrations */}
      <Stack.Screen name="EWayBillIntegration" component={EWayBillIntegrationScreen} />
      <Stack.Screen name="EInvoiceIntegration" component={EInvoiceIntegrationScreen} />

      {/* Report flows */}
      <Stack.Screen name="Financial"         component={FinancialScreen} />
      <Stack.Screen name="Compliance"        component={ComplianceScreen} />
      <Stack.Screen name="AuditTrail"        component={AuditTrailScreen} />
      <Stack.Screen name="AIInsights"        component={AIInsightsScreen} />
      <Stack.Screen name="GSTFiling"         component={GSTFilingScreen} />
      <Stack.Screen name="UnmatchedList"     component={UnmatchedListScreen} />
    </Stack.Navigator>
  );
}
