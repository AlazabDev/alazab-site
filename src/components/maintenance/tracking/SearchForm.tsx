
import React from 'react';
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  inputRequestNumber: string;
  setInputRequestNumber: (value: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
  inputRequestNumber, 
  setInputRequestNumber, 
  handleSearch, 
  isLoading 
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">البحث عن طلب</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="أدخل رقم الطلب"
          value={inputRequestNumber}
          onChange={(e) => setInputRequestNumber(e.target.value)}
          className="flex-1"
          dir="rtl"
        />
        <Button 
          onClick={handleSearch} 
          className="bg-construction-primary text-white"
          disabled={isLoading}
        >
          {isLoading ? 'جاري البحث...' : 'بحث'}
        </Button>
      </div>
      <div className="mt-4">
        <Link to="/maintenance-list">
          <Button variant="outline" className="text-construction-primary">
            عرض جميع الطلبات
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SearchForm;
