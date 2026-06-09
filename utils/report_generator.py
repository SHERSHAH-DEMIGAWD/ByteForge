import datetime

def generate_text_report(results, filename="report.txt"):
    """
    Generates a textual report from the benchmark results.
    """
    report = []
    report.append("="*50)
    report.append("BYTEFORGE COMPRESSION SUITE - REPORT")
    report.append("="*50)
    report.append(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Original File: {results['filename']}")
    report.append(f"Original Size: {results['original_size']} bytes")
    report.append("-" * 50)
    
    for algo, data in results['algorithms'].items():
        report.append(f"Algorithm: {algo.upper()}")
        if 'error' in data:
            report.append(f"  Status: ERROR - {data['error']}")
        else:
            report.append(f"  Compressed Size: {data['size']} bytes")
            report.append(f"  Ratio: {data['ratio']:.4f}")
            report.append(f"  Space Saving: {(1 - 1/data['ratio']) * 100:.2f}%" if data['ratio'] > 0 else "  Space Saving: 0%")
            report.append(f"  Time taken: {data['time']:.4f} ms")
        report.append("-" * 50)
        
    return "\n".join(report)
