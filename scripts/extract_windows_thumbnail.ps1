param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [int]$Size = 640
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies 'System.Drawing.dll' -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class ShellThumbnail
{
    [StructLayout(LayoutKind.Sequential)]
    public struct SIZE
    {
        public int cx;
        public int cy;
    }

    [ComImport]
    [Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IShellItemImageFactory
    {
        [PreserveSig]
        int GetImage(SIZE size, int flags, out IntPtr bitmap);
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    private static extern void SHCreateItemFromParsingName(
        [MarshalAs(UnmanagedType.LPWStr)] string path,
        IntPtr bindContext,
        [MarshalAs(UnmanagedType.LPStruct)] Guid interfaceId,
        [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory imageFactory);

    [DllImport("gdi32.dll")]
    private static extern bool DeleteObject(IntPtr objectHandle);

    public static System.Drawing.Bitmap Get(string path, int size)
    {
        Guid interfaceId = typeof(IShellItemImageFactory).GUID;
        IShellItemImageFactory factory;
        SHCreateItemFromParsingName(path, IntPtr.Zero, interfaceId, out factory);

        IntPtr handle;
        int result = factory.GetImage(new SIZE { cx = size, cy = size }, 0x00, out handle);
        if (result != 0 || handle == IntPtr.Zero)
        {
            Marshal.ThrowExceptionForHR(result);
        }

        try
        {
            return System.Drawing.Image.FromHbitmap(handle);
        }
        finally
        {
            DeleteObject(handle);
            Marshal.ReleaseComObject(factory);
        }
    }
}
'@

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$bitmap = [ShellThumbnail]::Get($resolvedInput, $Size)
try {
    $bitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
    $bitmap.Dispose()
}

[PSCustomObject]@{
    input = $resolvedInput
    output = $resolvedOutput
    width = $Size
    height = $Size
} | ConvertTo-Json -Compress
