"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Wallet,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  Coins,
  Activity,
  BarChart3,
} from "lucide-react";
import { useMyTasks } from "@/hooks/use-tasks";
import { useMySubmissions } from "@/hooks/use-submissions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MIST_PER_SUI = 1_000_000_000;
const SUI_EXPLORER_BASE = "https://suiscan.xyz/testnet";

export default function WalletPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { data: myTasks = [] } = useMyTasks();
  const { data: mySubmissions = [] } = useMySubmissions();

  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(true);
  const [ownedObjects, setOwnedObjects] = useState<any[]>([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) {
        setIsLoadingBalance(false);
        return;
      }

      try {
        const balanceData = await suiClient.getBalance({
          owner: account.address,
        });
        const suiBalance = (
          Number(balanceData.totalBalance) / MIST_PER_SUI
        ).toFixed(4);
        setBalance(suiBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast.error("Failed to fetch wallet balance");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [account?.address, suiClient]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!account?.address) {
        setIsLoadingTxs(false);
        return;
      }

      try {
        const txData = await suiClient.queryTransactionBlocks({
          filter: {
            FromAddress: account.address,
          },
          options: {
            showEffects: true,
            showInput: true,
          },
          limit: 10,
        });
        setTransactions(txData.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTxs(false);
      }
    };

    fetchTransactions();
  }, [account?.address, suiClient]);

  // Fetch owned objects
  useEffect(() => {
    const fetchOwnedObjects = async () => {
      if (!account?.address) {
        setIsLoadingObjects(false);
        return;
      }

      try {
        const objectsData = await suiClient.getOwnedObjects({
          owner: account.address,
          options: {
            showType: true,
            showContent: true,
          },
          limit: 20,
        });
        setOwnedObjects(objectsData.data || []);
      } catch (error) {
        console.error("Error fetching owned objects:", error);
      } finally {
        setIsLoadingObjects(false);
      }
    };

    fetchOwnedObjects();
  }, [account?.address, suiClient]);

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success("Address copied to clipboard");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Calculate platform statistics
  const totalTasksCreated = myTasks.length;
  const totalSubmissions = mySubmissions.length;
  const acceptedSubmissions = mySubmissions.filter((s) => s.status === "1").length;
  const totalEarnings = mySubmissions
    .filter((s) => s.status === "1")
    .reduce((sum, s) => {
      // This would need to be calculated from actual payout data
      return sum;
    }, 0);

  const totalSpent = myTasks.reduce((sum, task) => {
    return sum + Number(task.bounty) / MIST_PER_SUI;
  }, 0);

  if (!account) {
    return (
      <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <Card className="glass-card border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My Wallet
          </h1>
          <p className="text-muted-foreground mt-1">
            View your wallet details and transaction history
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowQR(!showQR)}
          className="w-full md:w-auto"
        >
          {showQR ? "Hide" : "Show"} QR Code
        </Button>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCodeSVG value={account.address} size={200} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan to get wallet address
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wallet Address Card */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Wallet Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
            <code className="text-sm font-mono break-all">
              {account.address}
            </code>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="flex-1 sm:flex-none"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 sm:flex-none"
              >
                <a
                  href={`${SUI_EXPLORER_BASE}/account/${account.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explorer
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Overview */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:shadow-lg transition-all duration-300 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Balance
            </CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary">
                  {balance} SUI
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available balance
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tasks posted
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {acceptedSubmissions}/{totalSubmissions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Accepted submissions
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSpent.toFixed(2)} SUI</div>
            <p className="text-xs text-muted-foreground mt-1">
              On task bounties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transactions and Objects */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">
            <Activity className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="objects">
            <BarChart3 className="h-4 w-4 mr-2" />
            Owned Objects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest blockchain transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTxs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No transactions found for this wallet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div
                      key={tx.digest || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            Transaction
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {formatAddress(tx.digest)}
                          </p>
                          {tx.timestampMs && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(Number(tx.timestampMs))}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                      >
                        <a
                          href={`${SUI_EXPLORER_BASE}/tx/${tx.digest}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Owned Objects</CardTitle>
              <CardDescription>
                Objects and NFTs owned by this wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingObjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ownedObjects.length === 0 ? (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    No objects found for this wallet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedObjects.map((obj, index) => (
                    <div
                      key={obj.data?.objectId || index}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`${SUI_EXPLORER_BASE}/object/${obj.data?.objectId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        Object #{index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {obj.data?.objectId && formatAddress(obj.data.objectId)}
                      </p>
                      {obj.data?.type && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {obj.data.type.split("::").pop()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
