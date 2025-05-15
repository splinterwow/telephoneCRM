
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

// Sample data
const lowStockItems = [
  { id: '1', name: 'iPhone 13 Pro Max', stock: 2, minStock: 5 },
  { id: '2', name: 'Samsung Galaxy S22', stock: 1, minStock: 5 },
  { id: '3', name: 'AirPods Pro', stock: 3, minStock: 10 },
  { id: '4', name: 'USB-C Charging Cable', stock: 4, minStock: 15 },
  { id: '5', name: 'Phone Case Clear', stock: 2, minStock: 10 },
];

export function LowStockProducts() {
  // const { t } = useTranslation();

  return (
    <Card className="card-gradient">
      <CardHeader>
        <CardTitle className="text-md">{("lowStock")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lowStockItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    item.stock === 0 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  )}
                >
                  {item.stock} / {item.minStock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
