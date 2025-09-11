import graphene
from graphene_django.types import DjangoObjectType
from .models import *



class BookType(DjangoObjectType):
    class Meta:
        model = Books
        fields = ("id", "name", "author", "category", "total", "available")
class InventoryType(DjangoObjectType):
    class Meta:
        model = Inventory
        fields = ("id", "name",  "image", "category", "status")
class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = ("id", "name","total", "available")

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
        print(name,category)
        category_obj = Category.objects.get(pk=int(category))
        inventory = Inventory.objects.create(name=name, category=category_obj,  )
        return CreateInventory(inventory=inventory)

class DeleteInventory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            inventory = Inventory.objects.get(pk=id)
            inventory.delete()
            return DeleteInventory(ok=True)
        except Books.DoesNotExist:
            return DeleteInventory(ok=False)

class CreateCategory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        total = graphene.Int(required=True)
        available = graphene.Int(required=False)

    category = graphene.Field(CategoryType)

    def mutate(root, info, name, total):
        category = Category.objects.create(name=name, total=total, available=total  )
        return CreateCategory(inventory=category)
    
    
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
    create_book = CreateBook.Field()
    delete_book = DeleteBook.Field()
    create_inventory = CreateInventory.Field()
    


schema = graphene.Schema(query=Query, mutation=Mutation)