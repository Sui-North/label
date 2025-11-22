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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Check,
  Image as ImageIcon,
  Package,
  Zap,
  Calendar,
  Hash,
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
  const [copied, setCopied] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const [hasMoreTxs, setHasMoreTxs] = useState(false);

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

  // Fetch transaction history with pagination
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
            showBalanceChanges: true,
          },
          limit: 20,
        });
        setTransactions(txData.data || []);
        setHasMoreTxs(txData.hasNextPage);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTxs(false);
      }
    };

    fetchTransactions();
  }, [account?.address, suiClient, txPage]);

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
            showDisplay: true,
          },
          limit: 50,
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
      setCopied(true);
      toast.success("Address copied to clipboard", {
        icon: <Check className="h-4 w-4" />,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getTransactionType = (tx: any) => {
    // Analyze transaction to determine type
    if (tx.effects?.created?.length > 0) return "create";
    if (tx.effects?.mutated?.length > 0) return "update";
    return "transfer";
  };

  const getObjectTypeName = (type: string) => {
    const parts = type.split("::");
    return parts[parts.length - 1] || "Unknown";
  };

  // Calculate platform statistics
  const totalTasksCreated = myTasks.length;
  const totalSubmissions = mySubmissions.length;
  const acceptedSubmissions = mySubmissions.filter((s) => s.status === "1").length;
  const acceptanceRate = totalSubmissions > 0 
    ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)
    : "0";

  const totalSpent = myTasks.reduce((sum, task) => {
    return sum + Number(task.bounty) / MIST_PER_SUI;
  }, 0);

  if (!account) {
    return (
      <div className="container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
        <Card className="glass-card border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
            My Wallet
          </h1>
          <p className="text-muted-foreground animate-in slide-in-from-left duration-500 delay-75">
            Manage your blockchain assets and view transaction history
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowQR(!showQR)}
          className="w-full md:w-auto transition-all duration-300 hover:scale-105"
        >
          {showQR ? "Hide" : "Show"} QR Code
        </Button>
      </div>

      {/* QR Code Section with Animation */}
      {showQR && (
        <Card className="glass-card animate-in slide-in-from-top duration-300">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg mb-4 shadow-lg animate-in zoom-in duration-300">
              <QRCodeSVG value={account.address} size={200} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan to get wallet address
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wallet Address Card with Enhanced Animation */}
      <Card className="glass-card border-primary/20 animate-in slide-in-from-bottom duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Wallet Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-primary/10">
            <code className="text-sm font-mono break-all flex-1">
              {account.address}
            </code>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={copyAddress}
                className={cn(
                  "flex-1 sm:flex-none transition-all duration-300",
                  copied && "bg-green-600 hover:bg-green-700"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 animate-in zoom-in duration-200" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 sm:flex-none transition-all duration-300 hover:scale-105"
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

      {/* Balance Overview with Stagger Animation */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:shadow-lg transition-all duration-300 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 animate-in slide-in-from-left duration-500 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Balance
            </CardTitle>
            <Coins className="h-4 w-4 text-primary animate-pulse" />
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="text-2xl font-bold text-primary animate-in zoom-in duration-300">
                  {balance} SUI
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available balance
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500 delay-75 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tasks posted
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500 delay-150 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <Progress value={Number(acceptanceRate)} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedSubmissions}/{totalSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 animate-in slide-in-from-left duration-500 delay-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
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
          <TabsTrigger value="transactions" className="transition-all duration-200">
            <Activity className="h-4 w-4 mr-2" />
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="objects" className="transition-all duration-200">
            <Package className="h-4 w-4 mr-2" />
            Objects ({ownedObjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4 animate-in fade-in duration-300">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                Your latest blockchain transactions with detailed information
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
                  {transactions.map((tx, index) => {
                    const txType = getTransactionType(tx);
                    const balanceChanges = tx.balanceChanges || [];
                    
                    return (
                      <div
                        key={tx.digest || index}
                        className="group flex flex-col p-4 border rounded-lg hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 gap-3 animate-in slide-in-from-right"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                            txType === "create" && "bg-green-500/10",
                            txType === "update" && "bg-blue-500/10",
                            txType === "transfer" && "bg-purple-500/10"
                          )}>
                            {txType === "create" && <Zap className="h-5 w-5 text-green-500" />}
                            {txType === "update" && <ArrowUpRight className="h-5 w-5 text-blue-500" />}
                            {txType === "transfer" && <ArrowDownLeft className="h-5 w-5 text-purple-500" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium capitalize flex items-center gap-2">
                                  {txType}
                                  <Badge variant="outline" className="text-xs">
                                    {tx.effects?.status?.status || "Unknown"}
                                  </Badge>
                                </p>
                                <p className="text-xs text-muted-foreground font-mono truncate flex items-center gap-1 mt-1">
                                  <Hash className="h-3 w-3" />
                                  {formatAddress(tx.digest)}
                                </p>
                              </div>
                              {tx.timestampMs && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {formatTimestamp(Number(tx.timestampMs))}
                                </div>
                              )}
                            </div>
                            
                            {balanceChanges.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {balanceChanges.slice(0, 3).map((change: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {Number(change.amount) > 0 ? "+" : ""}
                                    {(Number(change.amount) / MIST_PER_SUI).toFixed(4)} SUI
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <a
                              href={`${SUI_EXPLORER_BASE}/tx/${tx.digest}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objects" className="space-y-4 animate-in fade-in duration-300">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Owned Objects & NFTs
              </CardTitle>
              <CardDescription>
                Digital assets and objects owned by this wallet
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
                  {ownedObjects.map((obj, index) => {
                    const objectType = obj.data?.type || "";
                    const typeName = getObjectTypeName(objectType);
                    const hasDisplay = obj.data?.display?.data;
                    
                    return (
                      <div
                        key={obj.data?.objectId || index}
                        className="group p-4 border rounded-lg hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in zoom-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Avatar className="h-12 w-12 transition-transform duration-300 group-hover:scale-110">
                            {hasDisplay?.image_url ? (
                              <AvatarImage src={hasDisplay.image_url} alt={hasDisplay.name} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10">
                                <ImageIcon className="h-6 w-6 text-primary" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                        <div className="space-y-2">
                          <p className="text-sm font-medium truncate">
                            {hasDisplay?.name || `Object #${index + 1}`}
                          </p>
                          {hasDisplay?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {hasDisplay.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {obj.data?.objectId && formatAddress(obj.data.objectId)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {typeName}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
