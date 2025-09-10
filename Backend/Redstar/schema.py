import graphene
from graphene_django.types import DjangoObjectType
from .models import *



class BookType(DjangoObjectType):
    class Meta:
        model = Books
        fields = ("id", "name", "author", "category", "total", "available")

class Query(graphene.ObjectType):
    books = graphene.List(BookType)

    def resolve_books(root, info):
        return Books.objects.all()

schema = graphene.Schema(query=Query)


class CreateBook(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        author = graphene.String(required=True)
        category = graphene.String(required=True)
        total = graphene.Int(required=True)
        available = graphene.Int(required=False)

    book = graphene.Field(BookType)

    def mutate(root, info, name, author, category, total, available):
        book = Books.objects.create(name=name, category=category, author=author, total=total, available=available )
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
    create_book = CreateBook.Field()
    delete_book = DeleteBook.Field()
    


schema = graphene.Schema(query=Query, mutation=Mutation)