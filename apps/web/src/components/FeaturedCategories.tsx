import React from 'react';
import CategoryCard from './ui/CategoryCard';

type Category = {
  id: string;
  name: string;
  slug: string;
};

interface FeaturedCategoriesProps {
  categories: Category[];
}

const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories }) => {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-amber-700 dark:text-amber-200">Explore our categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
};


export default FeaturedCategories;
