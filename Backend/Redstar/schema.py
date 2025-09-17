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
        fields = ("id", "name", "total", "available", "image", "inventories")

    # image_url = graphene.String()

    # def resolve_image_url(self, info):
    #     if self.image:
    #         # ImageField always stores file paths, so build the full URL
    #         return info.context.build_absolute_uri(self.image.url)
    #     return None

class InventoryLendingType(DjangoObjectType):
    class Meta:
        model = InventoryLending
        fields = ("id", "name", "mobileNumber", "inventory", "address", "lendedDate", "returnDate", "remarks", "status")

class CountsType(graphene.ObjectType):
    inventories = graphene.Int()
    categories = graphene.Int()
    
class Query(graphene.ObjectType):
    books = graphene.List(BookType)
    inventories = graphene.List(InventoryType)
    categories = graphene.List(CategoryType)
    inventory_lending = graphene.List(InventoryLendingType)
    counts = graphene.Field(CountsType)

    def resolve_categories(root, info):
        return Category.objects.all()
    
    def resolve_inventories(root, info):
        return Inventory.objects.all()

    def resolve_inventory_lending(root, info):
        return InventoryLending.objects.all()
    
    def resolve_books(root, info):
        return Books.objects.all()
    
    def resolve_counts(root, info):
        return {
            "inventories": Inventory.objects.count(),
            "categories": Category.objects.count(),
        }

schema = graphene.Schema(query=Query)


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
        name = graphene.String(required=False)
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


class AddInventoryLending(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        inventory = graphene.ID(required=True)
        mobileNumber = graphene.String(required=True)
        address = graphene.String(required=True)
        lendedDate  = graphene.Date(required=True)
        remarks = graphene.String(required=False)
    
    inventory_lending = graphene.Field(InventoryLendingType)
    
    def mutate(self, info, name, inventory, mobileNumber, address, lendedDate, remarks):
        print("safe")
        if Inventory.objects.get(pk=inventory).status ==  False :
            raise Exception("Lending record not found")
        else:
            inventory_lending = InventoryLending.objects.create(
                name = name, 
                inventory = Inventory.objects.get(pk=inventory),
                mobileNumber = mobileNumber,
                address = address,
                lendedDate = lendedDate,
                returnDate = None,
                remarks = remarks,
                status = False
            )
            Inventory.objects.filter(pk=inventory).update(status=False)

        return AddInventoryLending(inventory_lending = inventory_lending)

class UpdateInventoryLending(graphene.Mutation):
    
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        inventory = graphene.ID()
        mobileNumber = graphene.String()
        returnDate = graphene.Date()
        address = graphene.String()
        lendedDate  = graphene.Date()
        remarks = graphene.String()

    inventory_lending = graphene.Field(InventoryLendingType)

    def mutate(self, info, id, **kwargs):
        print("ok")
        try:
            lending = InventoryLending.objects.get(pk=id)
        except InventoryLending.DoesNotExist:
            raise Exception("Lending record not found")

        for field, value in kwargs.items():
            if value is not None:
                if field == "inventory":
                    old_inventory = lending.inventory
                    if old_inventory:
                        old_inventory.status = True
                        old_inventory.save()

                    new_inventory = Inventory.objects.get(pk=int(value))
                    new_inventory.status = False
                    new_inventory.save()

                    setattr(lending, field, new_inventory)
                else:
                    setattr(lending, field, value)

        lending.save()
        return UpdateInventoryLending(inventory_lending=lending)
class ReturnInventoryLending(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        returnDate = graphene.Date(required=True)
        remarks = graphene.String()

    inventory_lending = graphene.Field(InventoryLendingType)

    def mutate(self, info, id, returnDate, remarks=None  ):
        print(returnDate)
        try:
            lending = InventoryLending.objects.get(pk=id)
        except InventoryLending.DoesNotExist:
            raise Exception("Lending record not found")
        
        lending.returnDate = returnDate
        lending.status = True
        if remarks is not None:
            lending.remarks = remarks
        lending.save()
        
        Inventory.objects.filter(pk=lending.inventory.pk).update(status=True)
       
        return ReturnInventoryLending(inventory_lending=lending)


class DeleteInventoryLending(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            lending = InventoryLending.objects.get(pk=id)
            if lending.status == 0:  
                raise Exception("Lending inventory not returned yet.")
            lending.delete()
            return DeleteInventoryLending(ok=True)
        except InventoryLending.DoesNotExist:
            raise Exception("Lending record not found.")
    
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

    add_inventory_lending = AddInventoryLending.Field()
    update_inventory_lending = UpdateInventoryLending.Field()
    return_inventory_lending = ReturnInventoryLending.Field()
    delete_inventory_lending = DeleteInventoryLending.Field()

    create_book = CreateBook.Field()
    delete_book = DeleteBook.Field()
    


schema = graphene.Schema(query=Query, mutation=Mutation)