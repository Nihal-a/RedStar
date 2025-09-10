import graphene
from graphene_django.types import DjangoObjectType
from .models import *



class BookType(DjangoObjectType):
    class Meta:
        model = Books
        fields = ("id", "name", "author", "category")

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

    book = graphene.Field(BookType)

    def mutate(root, info, name, author, category):
        book = Books.objects.create(name=name, category=category, author=author)
        return CreateBook(book=book)

class Mutation(graphene.ObjectType):
    create_post = CreateBook.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)