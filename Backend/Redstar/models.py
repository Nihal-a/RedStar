from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):


    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password) 
        user.save(using=self._db)
        return user
    
    def update_user_password(self,username, password):
        if not username or not password:
            raise ValueError('Username and password must be provided.')
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise ValueError('No user found with the provided username.')

        user.set_password(password)
        user.save(using=self._db)
        return user
    
    
    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user( username, password, **extra_fields)

    
class User(AbstractBaseUser,PermissionsMixin):
    username=models.CharField( max_length=50, unique=True,null=True,blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

class Category(models.Model):
    name = models.CharField( max_length=100, null=False)
    total = models.IntegerField(null=False, blank=False)
    available = models.IntegerField(null=True, blank=True)
    image = models.ImageField(upload_to="Inventory_images/", blank=True, null=True)

class Inventory(models.Model):
    name = models.CharField(max_length=100,null=False, blank=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    status = models.BooleanField(default=True)

class InventoryLending(models.Model):
    name = models.CharField(max_length=100, null=False, blank=False)
    mobile_number = models.IntegerField( null=False, blank=False )
    inventory = models.ForeignKey(Inventory, on_delete=models.CASCADE)
    address = models.CharField(max_length=200, null=False, blank=False)
    lended_date = models.DateField(null=False, blank=False)
    return_date = models.DateField(null=True, blank=True)
    remarks = models.CharField(max_length=200, null=True, blank=True)
    status = models.BooleanField(default=False)

class Books(models.Model):
    name = models.CharField(max_length=200, null=False, blank=False)
    author = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    total = models.IntegerField(null=False, blank=False)
    available = models.IntegerField(null=True, blank=True)

class BooksLending(models.Model):
    name = models.CharField(max_length=100, null=False, blank=False)
    mobile_number = models.IntegerField( null=False, blank=False )
    book = models.ForeignKey(Books, on_delete=models.CASCADE)
    address = models.CharField(max_length=200, null=False, blank=False)
    lended_date = models.DateField(null=False, blank=False)
    deadline = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    remarks = models.CharField(max_length=200, null=True, blank=True)
    status = models.BooleanField(default=False)

