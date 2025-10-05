from django.http import HttpResponse
import requests

def prnitpdf(request, url_type):
    pdf_bytes = generate_pdf_from_url(url_type)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="Report_{url_type}.pdf"'
    return response


def generate_pdf_from_url(url_type: str) -> bytes:
    api_url = "http://pdf.trickydot.com/pdf/url"
    payload = {
        "url": f"https://redstarpunnathala.in/report/{url_type}"
    }
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "x-api-key": "trickydot_pdf_maker_api"
    }

    response = requests.post(api_url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    return response.content
