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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  Copy,
  ExternalLink,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Check,
  Image as ImageIcon,
  Package,
  Zap,
  QrCode,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
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
  const [copied, setCopied] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch wallet balance
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

  useEffect(() => {
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
            showBalanceChanges: true,
          },
          limit: 20,
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalance();
    toast.success("Balance refreshed");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
            <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Wallet Not Connected</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Connect your wallet to view your balance, transactions, and digital assets
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {/* Hero Section with Balance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-8 md:p-10 text-white animate-in slide-in-from-top duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <p className="text-sm font-medium text-white/80">Total Balance</p>
              </div>
              <div className="flex items-center gap-4">
                {isLoadingBalance ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                    {hideBalance ? "••••••" : balance}
                  </h1>
                )}
                <span className="text-2xl font-semibold text-white/90">SUI</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setHideBalance(!hideBalance)}
                className="bg-white/20 hover:bg-white/30 border-white/20"
              >
                {hideBalance ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/20 hover:bg-white/30 border-white/20"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 border-white/20 backdrop-blur-sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Wallet QR Code</DialogTitle>
                  <DialogDescription>
                    Scan this QR code to get your wallet address
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center p-6">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <QRCodeSVG value={account.address} size={250} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="secondary"
              onClick={copyAddress}
              className={cn(
                "bg-white/20 hover:bg-white/30 border-white/20 backdrop-blur-sm transition-all duration-300",
                copied && "bg-green-500/30"
              )}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              asChild
              className="bg-white/20 hover:bg-white/30 border-white/20 backdrop-blur-sm"
            >
              <a
                href={`${SUI_EXPLORER_BASE}/account/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </a>
            </Button>
          </div>

          {/* Address Display */}
          <div className="pt-4 border-t border-white/20">
            <p className="text-xs text-white/60 mb-1">Wallet Address</p>
            <code className="text-sm font-mono text-white/90 break-all">
              {account.address}
            </code>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasksCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">Total posted</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{acceptanceRate}%</div>
            <Progress value={Number(acceptanceRate)} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedSubmissions}/{totalSubmissions} accepted
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">SUI on bounties</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="activity" className="text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-sm">
            <Package className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Your recent blockchain activity</CardDescription>
                </div>
                <Badge variant="secondary">{transactions.length} transactions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTxs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx, index) => {
                    const txType = getTransactionType(tx);
                    const balanceChanges = tx.balanceChanges || [];
                    
                    return (
                      <Dialog key={tx.digest || index}>
                        <DialogTrigger asChild>
                          <div
                            className="group flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                          >
                            <div className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                              txType === "create" && "bg-green-500/10",
                              txType === "update" && "bg-blue-500/10",
                              txType === "transfer" && "bg-purple-500/10"
                            )}>
                              {txType === "create" && <Zap className="h-6 w-6 text-green-500" />}
                              {txType === "update" && <ArrowUpRight className="h-6 w-6 text-blue-500" />}
                              {txType === "transfer" && <ArrowDownLeft className="h-6 w-6 text-purple-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold capitalize">{txType}</p>
                                <Badge variant="outline" className="text-xs">
                                  {tx.effects?.status?.status || "Unknown"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono truncate">
                                {formatAddress(tx.digest)}
                              </p>
                            </div>
                            <div className="text-right">
                              {tx.timestampMs && (
                                <p className="text-sm text-muted-foreground">
                                  {formatTimestamp(Number(tx.timestampMs))}
                                </p>
                              )}
                              {balanceChanges.length > 0 && (
                                <p className={cn(
                                  "text-sm font-semibold mt-1",
                                  Number(balanceChanges[0].amount) > 0 ? "text-green-500" : "text-orange-500"
                                )}>
                                  {Number(balanceChanges[0].amount) > 0 ? "+" : ""}
                                  {(Number(balanceChanges[0].amount) / MIST_PER_SUI).toFixed(4)} SUI
                                </p>
                              )}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              Transaction Details
                              <Badge variant="outline">{txType}</Badge>
                            </DialogTitle>
                            <DialogDescription>
                              View complete transaction information
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium mb-2">Transaction Hash</p>
                              <code className="text-xs bg-muted p-2 rounded block break-all">
                                {tx.digest}
                              </code>
                            </div>
                            {tx.timestampMs && (
                              <div>
                                <p className="text-sm font-medium mb-2">Timestamp</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(Number(tx.timestampMs)).toLocaleString()}
                                </p>
                              </div>
                            )}
                            {balanceChanges.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Balance Changes</p>
                                <div className="space-y-2">
                                  {balanceChanges.map((change: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                      <span className="text-sm">{change.coinType?.split("::").pop()}</span>
                                      <span className={cn(
                                        "text-sm font-semibold",
                                        Number(change.amount) > 0 ? "text-green-500" : "text-orange-500"
                                      )}>
                                        {Number(change.amount) > 0 ? "+" : ""}
                                        {(Number(change.amount) / MIST_PER_SUI).toFixed(4)} SUI
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              className="w-full"
                              asChild
                            >
                              <a
                                href={`${SUI_EXPLORER_BASE}/tx/${tx.digest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View on Explorer
                              </a>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Digital Assets</CardTitle>
                  <CardDescription>NFTs and objects you own</CardDescription>
                </div>
                <Badge variant="secondary">{ownedObjects.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingObjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ownedObjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No assets found</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ownedObjects.map((obj, index) => {
                    const objectType = obj.data?.type || "";
                    const typeName = getObjectTypeName(objectType);
                    const hasDisplay = obj.data?.display?.data;
                    
                    return (
                      <Card
                        key={obj.data?.objectId || index}
                        className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/5 to-purple-500/5 flex items-center justify-center relative overflow-hidden">
                          {hasDisplay?.image_url ? (
                            <img
                              src={hasDisplay.image_url}
                              alt={hasDisplay.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                        <CardContent className="p-4">
                          <p className="font-semibold truncate mb-1">
                            {hasDisplay?.name || `Asset #${index + 1}`}
                          </p>
                          {hasDisplay?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {hasDisplay.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {typeName}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                            >
                              <a
                                href={`${SUI_EXPLORER_BASE}/object/${obj.data?.objectId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Platform Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Tasks Created</span>
                  <span className="text-2xl font-bold">{totalTasksCreated}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Submissions Made</span>
                  <span className="text-2xl font-bold">{totalSubmissions}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Accepted</span>
                  <span className="text-2xl font-bold text-green-500">{acceptedSubmissions}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-2xl font-bold text-primary">{balance} SUI</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Total Spent</span>
                  <span className="text-2xl font-bold text-orange-500">{totalSpent.toFixed(2)} SUI</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-2xl font-bold text-green-500">{acceptanceRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
