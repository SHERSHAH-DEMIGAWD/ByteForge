from fpdf import FPDF
import datetime
import os

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.set_text_color(0, 170, 255) # #00AAFF
        self.cell(0, 10, 'ByteForge Data Compression Suite', 0, 1, 'C')
        self.set_font('Arial', 'I', 10)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, 'Formal Complexity & Benchmark Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_pdf_report(results, output_path="byteforge_report.pdf"):
    """
    Generates a formal PDF report.
    """
    pdf = PDFReport()
    pdf.add_page()
    
    # Dataset Specs
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, 'Dataset Characteristics', 0, 1)
    
    pdf.set_font('Arial', '', 11)
    pdf.cell(50, 10, 'File Name:', 0, 0)
    pdf.cell(0, 10, results['filename'], 0, 1)
    pdf.cell(50, 10, 'Original Size:', 0, 0)
    pdf.cell(0, 10, f"{results['original_size']} bytes", 0, 1)
    pdf.cell(50, 10, 'Generated On:', 0, 0)
    pdf.cell(0, 10, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 0, 1)
    pdf.ln(10)
    
    # Compression Results
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, 'Empirical Results', 0, 1)
    
    # Table Header
    pdf.set_fill_color(200, 200, 200)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(40, 10, 'Algorithm', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Comp. Size (B)', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Ratio', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Time (ms)', 1, 0, 'C', True)
    pdf.cell(40, 10, 'Peak Mem (MB)', 1, 1, 'C', True)
    
    pdf.set_font('Arial', '', 10)
    for algo, data in results['algorithms'].items():
        pdf.cell(40, 10, algo.upper(), 1, 0, 'C')
        if 'error' in data:
            pdf.cell(40, 10, 'ERROR', 1, 0, 'C')
            pdf.cell(30, 10, '-', 1, 0, 'C')
            pdf.cell(40, 10, '-', 1, 0, 'C')
            pdf.cell(40, 10, '-', 1, 1, 'C')
        else:
            pdf.cell(40, 10, str(data['size']), 1, 0, 'C')
            pdf.cell(30, 10, f"{data['ratio']:.3f}", 1, 0, 'C')
            pdf.cell(40, 10, f"{data['time']:.2f}", 1, 0, 'C')
            mem = f"{data['memory']:.3f}" if 'memory' in data else 'N/A'
            pdf.cell(40, 10, mem, 1, 1, 'C')
            
    pdf.ln(10)
    
    # Conclusion / Complexity bounds
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 10, 'Theoretical Complexity Bounds', 0, 1)
    
    pdf.set_font('Arial', '', 10)
    pdf.multi_cell(0, 8, "Huffman Coding: Time O(N log K), Space O(K)\n"
                         "LZ77: Time O(N) optimized, Space O(W)\n"
                         "RLE: Time O(N), Space O(1)\n"
                         "BWT Pipeline: Time O(N log N) using SA, Space O(N)\n"
                         "Deflate: Time O(N + N log K), Space O(W + K)")

    pdf.output(output_path)
    return output_path
