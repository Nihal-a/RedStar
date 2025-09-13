import graphene
import os
from graphql import GraphQLError
from graphene_django.types import DjangoObjectType
from .models import *
from graphene_file_upload.scalars import Upload
from django.conf import settings

class BookType(DjangoObjectType):
    class Meta:
        model = Books
        fields = ("id", "name", "author", "category", "total", "available")
class InventoryType(DjangoObjectType):
    class Meta:
        model = Inventory
        fields = ("id", "name", "category", "status")
class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = ("id", "name", "total", "available", "image")

    # image_url = graphene.String()

    # def resolve_image_url(self, info):
    #     if self.image:
    #         # ImageField always stores file paths, so build the full URL
    #         return info.context.build_absolute_uri(self.image.url)
    #     return None

    
class Query(graphene.ObjectType):
    books = graphene.List(BookType)
    inventories = graphene.List(InventoryType)
    categories = graphene.List(CategoryType)

    def resolve_books(root, info):
        return Books.objects.all()
    
    def resolve_inventories(root, info):
        return Inventory.objects.all()
    
    def resolve_categories(root, info):
        return Category.objects.all()
    

    

schema = graphene.Schema(query=Query)





class CreateBook(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        author = graphene.String(required=True)
        category = graphene.String(required=True)
        total = graphene.Int(required=True)
        available = graphene.Int(required=False)

    book = graphene.Field(BookType)

    def mutate(root, info, name, author, category, total, ):
        book = Books.objects.create(name=name, category=category, author=author, total=total, available=total )
        return CreateBook(book=book)

class CreateInventory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        category = graphene.ID(required=True)

    inventory = graphene.Field(InventoryType)

    def mutate(root, info, name,  category ):
        if Inventory.objects.filter(name__iexact=name).exists():
            raise GraphQLError(f"Product with name '{name}' already exists.")
        
        category_obj = Category.objects.get(pk=int(category))
        category_obj.total += 1
        category_obj.available += 1
        category_obj.save()
        
        inventory = Inventory.objects.create(name=name, category=category_obj,  )
        return CreateInventory(inventory=inventory)
class UpdateInventory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        category = graphene.ID()

    inventory = graphene.Field(InventoryType)

    def mutate(root, info, id, name=None,  category=None ):
        inventory = Inventory.objects.get(pk=int(id))
        if name is not None:
            inventory.name=name
        if category is not None:
            category_obj = Category.objects.get(pk=int(category))
            inventory.category=category_obj

        inventory.save()
        return UpdateInventory(inventory=inventory)

class DeleteInventory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            inventory = Inventory.objects.get(pk=id)
            category_id = inventory.category.id
            category = Category.objects.get(id=category_id)  # fixed get() call
            
            if category.total > 0:
                category.total -= 1
            if category.available > 0:
                category.available -= 1
            
            category.save()
            inventory.delete()

            return DeleteInventory(ok=True)
        except Inventory.DoesNotExist:
            return DeleteInventory(ok=False)

class CreateCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        image = graphene.String(required=False)
    
    category = graphene.Field(CategoryType)
    
    def mutate(self, info, name, image=None):
        
        
        if Category.objects.filter(name__iexact=name).exists():
            raise GraphQLError(f"Category with name '{name}' already exists.")
        
        # Create the category
        category = Category.objects.create(
            name=name, 
            total=0, 
            available=0, 
            image=image
        )
        
        return CreateCategory(category=category)

# class CreateCategory(graphene.Mutation):
#     class Arguments:
#         name = graphene.String(required=True)
#         image = Upload(required=False)

#     category = graphene.Field(CategoryType)

#     def mutate(root, info, name,image=None ):

#         if Category.objects.filter(name__iexact=name).exists():
#             raise GraphQLError(f"Category with name '{name}' already exists.")
        
#         if image is not None:
#             category = Category.objects.create(name=name, total=0, available=0, image=image )
#         else:
#             category = Category.objects.create(name=name, total=0, available=0 )
        
#         return CreateCategory(category=category)
    
class UpdateCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()

    category = graphene.Field(CategoryType)

    def mutate(root, info, id, name=None):
        print(id,name)
        category = Category.objects.get(pk=int(id))
        if name is not None:
            category.name=name
        
        category.save()
        return UpdateCategory(category=category)
    
class DeleteCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            category = Category.objects.get(pk=id)
            category.delete()
            return DeleteCategory(ok=True)
        except Category.DoesNotExist:
            return DeleteCategory(ok=False)
    
class DeleteBook(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            book = Books.objects.get(pk=id)
            book.delete()
            return DeleteBook(ok=True)
        except Books.DoesNotExist:
            return DeleteBook(ok=False)



class Mutation(graphene.ObjectType):

    create_inventory = CreateInventory.Field()
    update_inventory = UpdateInventory.Field()
    delete_inventory = DeleteInventory.Field()

    create_category = CreateCategory.Field()
    update_category = UpdateCategory.Field()
    delete_category = DeleteCategory.Field()

    create_book = CreateBook.Field()
    delete_book = DeleteBook.Field()
    


schema = graphene.Schema(query=Query, mutation=Mutation)