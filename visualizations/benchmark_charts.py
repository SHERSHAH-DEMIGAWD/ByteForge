import plotly.graph_objects as go
import pandas as pd

def create_ratio_chart(results):
    """Bar chart for compression ratio."""
    algos = []
    ratios = []
    for algo, data in results['algorithms'].items():
        if 'error' not in data:
            algos.append(algo.upper())
            ratios.append(data['ratio'])
            
    fig = go.Figure([go.Bar(x=algos, y=ratios, marker_color='#00AAFF')])
    fig.update_layout(
        title='Compression Ratio (Higher is Better)',
        xaxis_title='Algorithm',
        yaxis_title='Ratio (Original / Compressed)',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    # Add baseline 1.0
    fig.add_hline(y=1.0, line_dash="dash", line_color="red", annotation_text="No Compression (1.0)")
    return fig

def create_speed_chart(results):
    """Bar chart for compression speed."""
    algos = []
    times = []
    for algo, data in results['algorithms'].items():
        if 'error' not in data:
            algos.append(algo.upper())
            times.append(data['time'])
            
    fig = go.Figure([go.Bar(x=algos, y=times, marker_color='#FF4B4B')])
    fig.update_layout(
        title='Compression Time (Lower is Better)',
        xaxis_title='Algorithm',
        yaxis_title='Time (ms)',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def create_memory_chart(results):
    """Bar chart for peak memory usage."""
    algos = []
    mem = []
    for algo, data in results['algorithms'].items():
        if 'error' not in data and 'memory' in data:
            algos.append(algo.upper())
            mem.append(data['memory'])
            
    fig = go.Figure([go.Bar(x=algos, y=mem, marker_color='#00FF88')])
    fig.update_layout(
        title='Peak Memory Usage (Lower is Better)',
        xaxis_title='Algorithm',
        yaxis_title='Space Complexity (MB)',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def create_radar_chart():
    """Radar chart for algorithm complexity and suitability."""
    categories = ['Ratio', 'Speed', 'Simplicity', 'Space Eff.']
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatterpolar(
        r=[4, 4, 3, 4],
        theta=categories,
        fill='toself',
        name='Huffman'
    ))
    fig.add_trace(go.Scatterpolar(
        r=[3, 3, 2, 3],
        theta=categories,
        fill='toself',
        name='LZ77'
    ))
    fig.add_trace(go.Scatterpolar(
        r=[1, 5, 5, 5],
        theta=categories,
        fill='toself',
        name='RLE'
    ))
    fig.add_trace(go.Scatterpolar(
        r=[5, 1, 1, 1],
        theta=categories,
        fill='toself',
        name='BWT Pipeline'
    ))
    
    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 5])),
        showlegend=True,
        template='plotly_dark',
        title='Algorithm Characteristics Comparison',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig
