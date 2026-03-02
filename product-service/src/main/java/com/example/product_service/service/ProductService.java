package com.example.product_service.service;

import com.example.product_service.model.Product;
import com.example.product_service.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository repo;

    @Autowired
    private MongoTemplate mongoTemplate;

    @CacheEvict(value = "products", allEntries = true)
    public Product save(Product product) {
        return repo.save(product);
    }

    @Cacheable(value = "products")
    public List<Product> getAllProducts(String name, List<String> categories, Double minPrice, Double maxPrice,
            Boolean inStock) {
        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));

        if (name != null && !name.trim().isEmpty()) {
            String sanitizedQuery = name.trim();
            String[] searchTerms = sanitizedQuery.split("\\s+");

            List<Criteria> andCriterias = new ArrayList<>();

            for (String term : searchTerms) {
                String regexPattern = ".*" + term + ".*";
                Criteria orCriteria = new Criteria().orOperator(
                        Criteria.where("name").regex(regexPattern, "i"),
                        Criteria.where("description").regex(regexPattern, "i"),
                        Criteria.where("category").regex(regexPattern, "i"));
                andCriterias.add(orCriteria);
            }

            if (!andCriterias.isEmpty()) {
                query.addCriteria(new Criteria().andOperator(andCriterias.toArray(new Criteria[0])));
            }
        }

        if (categories != null && !categories.isEmpty()) {
            query.addCriteria(Criteria.where("category").in(categories));
        }

        if (minPrice != null || maxPrice != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (minPrice != null)
                priceCriteria.gte(minPrice);
            if (maxPrice != null)
                priceCriteria.lte(maxPrice);
            query.addCriteria(priceCriteria);
        }

        if (Boolean.TRUE.equals(inStock)) {
            query.addCriteria(Criteria.where("stock").gt(0));
        }

        return mongoTemplate.find(query, Product.class);
    }

    @Cacheable(value = "products")
    public Product getById(String id) {
        return repo.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return repo.existsById(id);
    }

    @CacheEvict(value = "products", allEntries = true)
    public Product deductStock(String id, int quantity) {
        Query query = new Query(Criteria.where("id").is(id).and("stock").gte(quantity));
        Update update = new Update().inc("stock", -quantity);
        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true);

        return mongoTemplate.findAndModify(query, update, options, Product.class);
    }
}
