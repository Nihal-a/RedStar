
import graphene
import base64
import os
from graphql import GraphQLError
from graphene_django.types import DjangoObjectType
from .models import *
from datetime import date, timedelta,datetime
from graphene.types.datetime import Date
from django.db.models import F,Sum 
import graphql_jwt
from graphql_jwt.decorators import login_required
from django.contrib.auth import get_user_model
from graphene_file_upload.scalars import Upload
from django.core.files.base import ContentFile
from django.conf import settings


# membershipId Generator function

def MembershipIdGenerator(last_id=None):
    """
    Generates a unique membership ID in the format: BMLIBmmyy-XXXX
    The serial (XXXX) never repeats, even if month changes.
    """
    prefix = "BMLIB"
    date_code = datetime.now().strftime("%m%y")  # current month-year

    if last_id:
        try:
            _, last_serial = last_id.split("-")
            new_serial = int(last_serial) + 1
        except Exception:
            new_serial = 1
    else:
        new_serial = 1

    serial_str = str(new_serial).zfill(4)  # pad with leading zeros
    return f"{prefix}{date_code}-{serial_str}"

# -----------------------------------------------------------------------------------------------------------------------------------------------------------------
# ------------------------------------QUERIES----------------------------------------------------------------------------------------------------------------------
User = get_user_model()
class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username")

class InventoryType(DjangoObjectType):
    class Meta:
        model = Inventory
        fields = ("id", "name", "category", "status")

class CategoryType(DjangoObjectType):
    class Meta:
        model = Category
        fields = ("id", "name", "image", "inventories")

class InventoryLendingType(DjangoObjectType):
    class Meta:
        model = InventoryLending    
        fields = ("id", "name", "mobileNumber", "inventory", "address", "lendedDate", "returnDate", "remarks", "status")

class MembershipsType(DjangoObjectType):
    class Meta:
        model = Memberships
        fields = ("id", "membershipId", "name", "dob", "profile", "mobileNumber", "address", "validuntil")

class BookType(DjangoObjectType):
    class Meta:
        model = Books
        fields = ("id", "name", "author", "category", "total", "available")
    
class BookLendingType(DjangoObjectType):
    class Meta:
        model = BooksLending
        fields = ("id", "member", "book", "lendedDate", "returnDate", "remarks", "status")

class CountsType(graphene.ObjectType):
    inventories = graphene.Int()
    issuedInvCurrently = graphene.Int()
    issuedInvTill = graphene.Int()
    books = graphene.Int()
    issuedBooksCurrently = graphene.Int()
    issuedBooksTill = graphene.Int()
    categories = graphene.Int()
    memberships = graphene.Int()
    

class Query(graphene.ObjectType):
    books = graphene.List(BookType)
    inventories = graphene.List(InventoryType)
    categories = graphene.List(CategoryType)
    inventory_lending = graphene.List(InventoryLendingType)
    counts = graphene.Field(CountsType)
    memberships = graphene.List(MembershipsType)
    book_lending = graphene.List(BookLendingType)

    def resolve_categories(root, info):
        return Category.objects.all().order_by("name")
    
    def resolve_inventories(root, info):
        return Inventory.objects.all().order_by("name")

    def resolve_inventory_lending(root, info):
        return InventoryLending.objects.all().order_by("-lendedDate")

    def resolve_memberships(root, info):
        return Memberships.objects.all().order_by("name")
       
    def resolve_books(root, info):
        return Books.objects.all().order_by("name")
    
    def resolve_book_lending(root, info):
        return BooksLending.objects.all().order_by("-lendedDate")
    
    def resolve_counts(root, info):
        total_books = Books.objects.aggregate(total=Sum('total'))['total'] or 0  

        return {
            "inventories": Inventory.objects.count(),
            "issuedInvCurrently": Inventory.objects.filter(status=False).count(),
            "issuedInvTill": InventoryLending.objects.count(),
            "books": total_books,  
            "issuedBooksCurrently": BooksLending.objects.filter(status=False).count(),
            "issuedBooksTill": BooksLending.objects.count(),
            "memberships" :Memberships.objects.count(),
            "categories": Category.objects.count(),
        }
    


schema = graphene.Schema(query=Query)


# -------------------------------------------------------------------------------------------------------------------------------------------------------------------
# ------------------------------------MUTATIONS----------------------------------------------------------------------------------------------------------------------

class ChangePassword(graphene.Mutation):
    class Arguments:
        old_password = graphene.String(required=True)
        new_password = graphene.String(required=True)
        confirm_password = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, old_password, new_password, confirm_password):
        user = info.context.user

        if user.is_anonymous:
            raise GraphQLError("You must be logged in to change password.")
        
        if not user.check_password(old_password):
            raise GraphQLError("Old password is incorrect.")

        if new_password != confirm_password:
            raise GraphQLError("New passwords do not match.")

        user.set_password(new_password)
        user.save()

        return ChangePassword(success=True, message="Password changed successfully.")


class CreateInventory(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        category = graphene.ID(required=True)

    inventory = graphene.Field(InventoryType)

    def mutate(root, info, name,  category ):
        if Inventory.objects.filter(name__iexact=name).exists():
            raise GraphQLError(f"Product with name '{name}' already exists.")
        
        category_obj = Category.objects.get(pk=int(category))
    
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
            if inventory.status == 0:  
                raise Exception("Selected inventory is lended already, not returned.")
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
        image_file = None

        if image:
            if image.startswith("data:image"):
                format, imgstr = image.split(";base64,")
                ext = format.split("/")[-1]
                decoded_img = base64.b64decode(imgstr)

                max_size = 2 * 1024 * 1024  # 2 MB
                if len(decoded_img) > max_size:
                    raise GraphQLError("Image file size must be under 2MB")
                
                image_file = ContentFile(decoded_img, name=f"{name}.{ext}")
            else:
                raise GraphQLError("Invalid image format")
            
        if Category.objects.filter(name__iexact=name).exists():
            raise GraphQLError(f"Category with name '{name}' already exists.")

        category = Category.objects.create(
            name=name,
            image=image_file
        )
        
        return CreateCategory(category=category)

class UpdateCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        image = graphene.String() 

    category = graphene.Field(CategoryType)

    def mutate(root, info, id, name=None, image=None):
        try:
            category = Category.objects.get(pk=int(id))
        except Category.DoesNotExist:
            raise GraphQLError("Category not found")

        if name is not None:
            category.name = name

        if image:
            if category.image and os.path.isfile(category.image.path):
                os.remove(category.image.path)

            if image.startswith("data:image"):
                format, imgstr = image.split(";base64,")
                ext = format.split("/")[-1]
                category.image = ContentFile(base64.b64decode(imgstr), name=f"{category.name}.{ext}")
            else:
                raise GraphQLError("Invalid image format")

        category.save()
        return UpdateCategory(category=category)

class DeleteCategory(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            category = Category.objects.get(pk=id)
            
            if category.image:
                image_path = os.path.join(settings.MEDIA_ROOT, str(category.image))
                if os.path.exists(image_path):
                    os.remove(image_path)

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
        remarks = graphene.String()
    
    inventory_lending = graphene.Field(InventoryLendingType)
    
    def mutate(self, info, name, inventory, mobileNumber, address, lendedDate, remarks=None):
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
    
class AddMembership(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        address = graphene.String(required=True)
        mobileNumber = graphene.String(required=True)
        profile = graphene.String()
        dob =graphene.Date(required=True) 

    memberships = graphene.Field(MembershipsType)

    def mutate(root, info, name, address, mobileNumber, dob, profile=None, ):
        image_file = None

        if profile:
            if profile.startswith("data:image"):
                format, imgstr = profile.split(";base64,")
                ext = format.split("/")[-1]
                decoded_img = base64.b64decode(imgstr)

                max_size = 2 * 1024 * 1024  # 2 MB
                if len(decoded_img) > max_size:
                    raise GraphQLError("Image file size must be under 2MB")

                image_file = ContentFile(decoded_img, name=f"{name}.{ext}")
            else:
                raise GraphQLError("Invalid image format")

        last_obj = Memberships.objects.order_by("-membershipId").first()
        if last_obj:
            membershipId = MembershipIdGenerator(last_obj.membershipId)
        else:
            membershipId = MembershipIdGenerator()
        validuntil_date = date.today() + timedelta(days=365)

        memberships = Memberships.objects.create(
            name=name,
            address=address,
            mobileNumber=mobileNumber,
            membershipId=membershipId,
            validuntil=validuntil_date,
            profile=image_file,
            dob=dob  
        )

        return AddMembership(memberships=memberships)


class UpdateMembership(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        address = graphene.String()
        mobileNumber = graphene.String()
        profile = graphene.String()  # base64 image
        validuntil = graphene.Date()
        dob = graphene.Date()

    memberships = graphene.Field(MembershipsType)

    def mutate(root, info, id, **kwargs):
        memberships = Memberships.objects.get(pk=int(id))

        profile_data = kwargs.pop("profile", None)
        if profile_data:
            if memberships.profile and os.path.isfile(memberships.profile.path):
                os.remove(memberships.profile.path)

            if profile_data.startswith("data:image"):
                format, imgstr = profile_data.split(";base64,")
                ext = format.split("/")[-1]
                memberships.profile = ContentFile(base64.b64decode(imgstr), name=f"{memberships.name}.{ext}")
            else:
                raise GraphQLError("Invalid image format")

        for field, value in kwargs.items():
            if value is not None:
                setattr(memberships, field, value)

        memberships.save()
        return UpdateMembership(memberships=memberships)

    


class RenewMembership(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        validuntil = Date(required=True)   # instead of String

    memberships = graphene.Field(MembershipsType)

    def mutate(root, info, id, validuntil):
        memberships = Memberships.objects.get(pk=int(id))
        memberships.validuntil = validuntil 
        memberships.save()
        return RenewMembership(memberships=memberships)
    
class DeleteMembership(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            membership = Memberships.objects.get(pk=id)
            if membership.profile and os.path.isfile(membership.profile.path):
                os.remove(membership.profile.path)
        
            membership.delete()
            return DeleteMembership(ok=True)
        except Memberships.DoesNotExist:
            return DeleteMembership(ok=False)
    

class CreateBook(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        author = graphene.String(required=True)
        category = graphene.String(required=True)
        total = graphene.Int(required=True)

    book = graphene.Field(BookType)

    def mutate(root, info, name, author, category, total):
        name = name.strip()
        author = author.strip()
        category = category.strip()

        existing_book = Books.objects.filter(name__iexact=name).first()

        if existing_book:
            raise GraphQLError(f"A book named '{name}' already exists.")

        book = Books.objects.create(
            name=name,
            author=author,
            category=category,
            total=total,
            available=total
        )

        return CreateBook(book=book)



class UpdateBook(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        author = graphene.String()
        category = graphene.String()
        total = graphene.Int()

    book = graphene.Field(BookType)

    def mutate(root, info, id, **kwargs):
        try:
            book = Books.objects.get(pk=int(id))
        except Books.DoesNotExist:
            raise GraphQLError("Book not found.")

        new_name = kwargs.get("name", book.name)
        new_author = kwargs.get("author", book.author)
        new_category = kwargs.get("category", book.category)

        existing_book = Books.objects.filter(
            name__iexact=new_name.strip(),
            author__iexact=new_author.strip(),
            category__iexact=new_category.strip()
        ).exclude(pk=book.pk).first()

        if existing_book:
            raise GraphQLError("A book with the same name, author, and category already exists.")

        if "total" in kwargs and kwargs["total"] is not None:
            new_total = kwargs["total"]
            old_total = book.total
            old_available = book.available
            lent_out = old_total - old_available

            if new_total < lent_out:
                raise GraphQLError(
                    f"Cannot reduce total to {new_total}, since {lent_out} copies are currently lent out."
                )

            if new_total > old_total:
                diff = new_total - old_total
                book.available = old_available + diff
            elif new_total < old_total:
                diff = old_total - new_total
                if diff > old_available:
                    raise GraphQLError(
                        f"Cannot reduce total by {diff}, only {old_available} copies are available."
                    )
                book.available = old_available - diff

            book.total = new_total
            kwargs.pop("total")

        for field, value in kwargs.items():
            if value is not None:
                setattr(book, field, value.strip() if isinstance(value, str) else value)

        book.save()
        return UpdateBook(book=book)

class DeleteBook(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            book = Books.objects.get(pk=id)
            
            if book.available == book.total:
                book.delete()
                return DeleteBook(ok=True)
            raise Exception("Cannot delete book: some copies are still lent out.")
        except Books.DoesNotExist:
            raise Exception("Book not found")


class CreateBookLending(graphene.Mutation):
    class Arguments:
        member = graphene.ID(required=True)
        book = graphene.ID(required=True)
        lendedDate = graphene.Date(required=True)
        remarks = graphene.String()

    book_lending = graphene.Field(BookLendingType)

    def mutate(root, info, member, book, lendedDate, remarks=None):
        try:
            member_obj = Memberships.objects.get(pk=member)
        except Memberships.DoesNotExist:
            raise GraphQLError("Member not found")

        try:
            book_obj = Books.objects.get(pk=book)

        except Books.DoesNotExist:
            raise GraphQLError("Book not found")
        
        if book_obj.available == 0 :
            raise GraphQLError("Book not avaialable")
        else:
            book_obj.available -= 1
            book_obj.save()
            
        book_lending = BooksLending.objects.create(
            member=member_obj,
            book=book_obj,
            lendedDate=lendedDate,
            remarks=remarks,
            status=False
        )

        return CreateBookLending(book_lending=book_lending)


class UpdateBookLending(graphene.Mutation):
    
    class Arguments:
        id = graphene.ID(required=True)
        member = graphene.ID()
        book = graphene.ID()
        returnDate = graphene.Date()
        lendedDate  = graphene.Date()
        remarks = graphene.String()

    book_lending = graphene.Field(BookLendingType)

    def mutate(self, info, id, **kwargs):
        try:
            lending = BooksLending.objects.get(pk=id)
        except BooksLending.DoesNotExist:
            raise Exception("Lending record not found")

        for field, value in kwargs.items():
            if value is not None:
                if field == "book":
                    old_book = lending.book
                    if old_book:
                        old_book.available += 1
                        old_book.save()

                    new_book = Books.objects.get(pk=int(value))

                    if new_book.available == 0 :
                        raise GraphQLError("Book not avaialable")
                    else:
                        new_book.available -= 1
                        new_book.save()

                    setattr(lending, field, new_book)

                elif field == "member":
                    new_member = Memberships.objects.get(pk=int(value))
                    setattr(lending, field, new_member)

                else:
                    setattr(lending, field, value)

        lending.save()
        return UpdateBookLending(book_lending=lending)


class ReturnBookLending(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        returnDate = graphene.Date(required=True)
        remarks = graphene.String()

    book_lending = graphene.Field(BookLendingType)

    def mutate(self, info, id, returnDate, remarks=None  ):
        try:
            lending = BooksLending.objects.get(pk=id)
        except BooksLending.DoesNotExist:
            raise Exception("Lending record not found")
        
        lending.returnDate = returnDate
        lending.status = True
        if remarks is not None:
            lending.remarks = remarks
        lending.save()
        
        Books.objects.filter(pk=lending.book.pk).update(available=F('available') + 1)
       
        return ReturnBookLending(book_lending=lending)

    
class DeleteBookLending(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)

    ok = graphene.Boolean()

    def mutate(self, info, id):
        try:
            lending = BooksLending.objects.get(pk=id)
            if lending.status == 0:  
                raise Exception("Lending Book not returned yet.")
            lending.delete()
            return DeleteBookLending(ok=True)
        except BooksLending.DoesNotExist:
            raise Exception("Lending record not found.")




class Mutation(graphene.ObjectType):

    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    delete_token_cookie = graphql_jwt.DeleteJSONWebTokenCookie.Field()
    revoke_token = graphql_jwt.Revoke.Field()
    delete_refresh_token_cookie = \
        graphql_jwt.relay.DeleteRefreshTokenCookie.Field()

    change_password = ChangePassword.Field()

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

    add_membership = AddMembership.Field()
    update_membership = UpdateMembership.Field()
    renew_membership = RenewMembership.Field()
    delete_membership = DeleteMembership.Field()

    create_book = CreateBook.Field()
    delete_book = DeleteBook.Field()
    update_book = UpdateBook.Field()

    create_book_lending =  CreateBookLending.Field()
    update_book_lending = UpdateBookLending.Field()
    return_book_lending = ReturnBookLending.Field()
    delete_book_lending = DeleteBookLending.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)