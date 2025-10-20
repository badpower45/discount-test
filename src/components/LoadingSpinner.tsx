export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            جاري التحميل...
          </h2>
          <p className="text-sm text-muted-foreground">
            يرجى الانتظار قليلاً
          </p>
        </div>
      </div>
    </div>
  );
}
