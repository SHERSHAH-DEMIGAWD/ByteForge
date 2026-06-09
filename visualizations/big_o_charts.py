import plotly.graph_objects as go
import numpy as np
from scipy.optimize import curve_fit

def _linear(x, a, b):
    return a * x + b

def _n_log_n(x, a, b):
    return a * x * np.log2(x + 1) + b

def _quadratic(x, a, b):
    return a * x**2 + b

def create_empirical_chart(sizes, times, algo_name, expected_complexity="O(N)"):
    """
    Creates a scatter plot of empirical execution times with a curve fit 
    to prove the Big-O time complexity.
    """
    if len(sizes) < 3:
        # Not enough data for a good curve fit
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=sizes, y=times, mode='lines+markers', name='Actual Time'))
        return fig
        
    x_data = np.array(sizes)
    y_data = np.array(times)
    
    # Generate smooth x for curve drawing
    x_smooth = np.linspace(min(x_data), max(x_data), 100)
    
    try:
        if expected_complexity == "O(N)":
            popt, _ = curve_fit(_linear, x_data, y_data)
            y_fit = _linear(x_smooth, *popt)
            fit_label = "O(N) Fit"
        elif expected_complexity == "O(N log N)":
            popt, _ = curve_fit(_n_log_n, x_data, y_data)
            y_fit = _n_log_n(x_smooth, *popt)
            fit_label = "O(N log N) Fit"
        else: # O(N^2)
            popt, _ = curve_fit(_quadratic, x_data, y_data)
            y_fit = _quadratic(x_smooth, *popt)
            fit_label = "O(N²) Fit"
            
    except Exception as e:
        # Fallback if fit fails
        y_fit = None
        
    fig = go.Figure()
    
    # Actual data
    fig.add_trace(go.Scatter(
        x=x_data, y=y_data, 
        mode='markers', 
        name='Empirical Data',
        marker=dict(size=10, color='#00AAFF')
    ))
    
    # Fitted curve
    if y_fit is not None:
        fig.add_trace(go.Scatter(
            x=x_smooth, y=y_fit, 
            mode='lines', 
            name=fit_label,
            line=dict(dash='dash', color='#FF4B4B')
        ))
        
    fig.update_layout(
        title=f'{algo_name} Empirical Validation ({expected_complexity})',
        xaxis_title='Input Size (bytes)',
        yaxis_title='Execution Time (ms)',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig
