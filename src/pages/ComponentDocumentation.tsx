import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";

const ComponentDocumentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">UI Component Documentation</CardTitle>
              <CardDescription className="text-lg">
                프로젝트에서 사용하는 모든 디자인 컴포넌트 라이브러리
              </CardDescription>
            </CardHeader>
          </Card>
        </header>

        {/* Table of Contents */}
        <nav className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">목차</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-primary mb-2">기본 컴포넌트</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="#button" className="text-muted-foreground hover:text-primary">Button</a></li>
                    <li><a href="#input" className="text-muted-foreground hover:text-primary">Input</a></li>
                    <li><a href="#textarea" className="text-muted-foreground hover:text-primary">Textarea</a></li>
                    <li><a href="#checkbox" className="text-muted-foreground hover:text-primary">Checkbox</a></li>
                    <li><a href="#switch" className="text-muted-foreground hover:text-primary">Switch</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">레이아웃</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="#card" className="text-muted-foreground hover:text-primary">Card</a></li>
                    <li><a href="#tabs" className="text-muted-foreground hover:text-primary">Tabs</a></li>
                    <li><a href="#separator" className="text-muted-foreground hover:text-primary">Separator</a></li>
                    <li><a href="#accordion" className="text-muted-foreground hover:text-primary">Accordion</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">피드백</h3>
                  <ul className="space-y-1 text-sm">
                    <li><a href="#alert" className="text-muted-foreground hover:text-primary">Alert</a></li>
                    <li><a href="#badge" className="text-muted-foreground hover:text-primary">Badge</a></li>
                    <li><a href="#progress" className="text-muted-foreground hover:text-primary">Progress</a></li>
                    <li><a href="#skeleton" className="text-muted-foreground hover:text-primary">Skeleton</a></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </nav>

        {/* Components Sections */}
        <div className="space-y-8">
          {/* Basic Components */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-primary border-b pb-4">기본 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Button */}
                <div id="button" className="space-y-4">
                  <h3 className="text-xl font-semibold">Button</h3>
                  <p className="text-muted-foreground">다양한 스타일과 상태를 지원하는 버튼 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Destructive</Button>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div id="input" className="space-y-4">
                  <h3 className="text-xl font-semibold">Input</h3>
                  <p className="text-muted-foreground">텍스트 입력을 위한 기본 입력 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background space-y-2">
                    <Input placeholder="Enter text..." />
                    <Input type="email" placeholder="Email" />
                    <Input type="password" placeholder="Password" />
                  </div>
                </div>

                {/* Textarea */}
                <div id="textarea" className="space-y-4">
                  <h3 className="text-xl font-semibold">Textarea</h3>
                  <p className="text-muted-foreground">여러 줄 텍스트 입력을 위한 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Textarea placeholder="Enter multiple lines..." />`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Textarea placeholder="Enter multiple lines..." />
                  </div>
                </div>

                {/* Checkbox */}
                <div id="checkbox" className="space-y-4">
                  <h3 className="text-xl font-semibold">Checkbox</h3>
                  <p className="text-muted-foreground">체크박스 입력 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms">Accept terms and conditions</Label>
                    </div>
                  </div>
                </div>

                {/* Switch */}
                <div id="switch" className="space-y-4">
                  <h3 className="text-xl font-semibold">Switch</h3>
                  <p className="text-muted-foreground">온/오프 토글 스위치 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="flex items-center space-x-2">
                      <Switch id="airplane-mode" />
                      <Label htmlFor="airplane-mode">Airplane Mode</Label>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

          {/* Layout Components */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-primary border-b pb-4">레이아웃 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Card */}
                <div id="card" className="space-y-4">
                  <h3 className="text-xl font-semibold">Card</h3>
                  <p className="text-muted-foreground">콘텐츠를 그룹화하는 카드 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Card className="w-full max-w-md">
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Card content goes here</p>
                      </CardContent>
                      <CardFooter>
                        <Button>Action</Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>

                {/* Tabs */}
                <div id="tabs" className="space-y-4">
                  <h3 className="text-xl font-semibold">Tabs</h3>
                  <p className="text-muted-foreground">탭 네비게이션 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account content</TabsContent>
  <TabsContent value="password">Password content</TabsContent>
</Tabs>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Tabs defaultValue="account" className="w-full max-w-md">
                      <TabsList>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                      </TabsList>
                      <TabsContent value="account">Account content goes here</TabsContent>
                      <TabsContent value="password">Password content goes here</TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Separator */}
                <div id="separator" className="space-y-4">
                  <h3 className="text-xl font-semibold">Separator</h3>
                  <p className="text-muted-foreground">콘텐츠를 구분하는 구분선 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<div>
  <p>Content above</p>
  <Separator />
  <p>Content below</p>
</div>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div>
                      <p>Content above</p>
                      <Separator className="my-4" />
                      <p>Content below</p>
                    </div>
                  </div>
                </div>

                {/* Accordion */}
                <div id="accordion" className="space-y-4">
                  <h3 className="text-xl font-semibold">Accordion</h3>
                  <p className="text-muted-foreground">접고 펼칠 수 있는 아코디언 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
</Accordion>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Accordion type="single" collapsible className="w-full max-w-md">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Section 1</AccordionTrigger>
                        <AccordionContent>Content for section 1</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Section 2</AccordionTrigger>
                        <AccordionContent>Content for section 2</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

          {/* Feedback Components */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-primary border-b pb-4">피드백 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Alert */}
                <div id="alert" className="space-y-4">
                  <h3 className="text-xl font-semibold">Alert</h3>
                  <p className="text-muted-foreground">사용자에게 중요한 정보를 알리는 알림 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>Alert description</AlertDescription>
</Alert>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Heads up!</AlertTitle>
                      <AlertDescription>
                        You can add components to your app using the cli.
                      </AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Your session has expired. Please log in again.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* Badge */}
                <div id="badge" className="space-y-4">
                  <h3 className="text-xl font-semibold">Badge</h3>
                  <p className="text-muted-foreground">작은 라벨이나 상태를 표시하는 배지 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div id="progress" className="space-y-4">
                  <h3 className="text-xl font-semibold">Progress</h3>
                  <p className="text-muted-foreground">진행 상태를 표시하는 프로그레스 바 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Progress value={60} />`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Progress value={60} className="w-full max-w-md" />
                  </div>
                </div>

                {/* Skeleton */}
                <div id="skeleton" className="space-y-4">
                  <h3 className="text-xl font-semibold">Skeleton</h3>
                  <p className="text-muted-foreground">로딩 상태를 표시하는 스켈레톤 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

          {/* Data Display Components */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-primary border-b pb-4">데이터 표시 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Avatar */}
                <div id="avatar" className="space-y-4">
                  <h3 className="text-xl font-semibold">Avatar</h3>
                  <p className="text-muted-foreground">사용자 프로필 이미지를 표시하는 아바타 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Avatar>
  <AvatarImage src="/avatars/01.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <div className="flex space-x-2">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                      <Avatar>
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div id="table" className="space-y-4">
                  <h3 className="text-xl font-semibold">Table</h3>
                  <p className="text-muted-foreground">데이터를 표 형태로 표시하는 테이블 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>John Doe</TableCell>
                          <TableCell>Active</TableCell>
                          <TableCell>Admin</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Jane Smith</TableCell>
                          <TableCell>Inactive</TableCell>
                          <TableCell>User</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

          {/* Interactive Components */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-primary border-b pb-4">인터랙티브 컴포넌트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">

                {/* Dialog */}
                <div id="dialog" className="space-y-4">
                  <h3 className="text-xl font-semibold">Dialog</h3>
                  <p className="text-muted-foreground">모달 대화상자 컴포넌트</p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm"><code>{`<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`}</code></pre>
                  </div>
                  <div className="p-4 border rounded-md bg-background">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Open Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Dialog Title</DialogTitle>
                          <DialogDescription>
                            This is a dialog description. You can add any content here.
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ComponentDocumentation;