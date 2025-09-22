
import json
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML

def resolve_printPdf(request):
    try:
        print("111111111")
        data = json.loads(request.body)
        html = data.get('html', '')
        print(html)
        # html_string = request.build_absolute_uri("http://localhost:8000/printpdf/" + path)
        # print(html_string)
        html_ = HTML(string= html)
        print(html_)
        pdf = html_.write_pdf()

        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="name.pdf"'
        return response
    except Exception as e:
        print(f"Error building absolute URI: {e}")
        return HttpResponse("Error generating PDF", status=500)
    