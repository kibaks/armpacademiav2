"""Create a clean silent source master from the original portrait, without neural mouth models. Requires numpy, OpenCV and ffmpeg."""
import sys, json, subprocess
from pathlib import Path
import cv2, numpy as np
cv2.setNumThreads(1)
root=Path(sys.argv[1]); out=root; report=[]
def run(a): subprocess.run(a,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
for name,source,closed,pose in [("sync","portrait.png","closed.png","neutral")]:
    src=cv2.resize(cv2.imread(str(root/source)),(540,720)); h,w=src.shape[:2]
    shut=cv2.imread(str(out/closed)); shut=cv2.resize(shut,(w,h))
    sift=cv2.SIFT_create(); k1,d1=sift.detectAndCompute(shut,None); k2,d2=sift.detectAndCompute(src,None)
    matches=cv2.BFMatcher().knnMatch(d1,d2,k=2); good=[a for a,b in matches if a.distance<.72*b.distance]
    if len(good)<12: raise RuntimeError('Insufficient alignment '+name)
    mat,inliers=cv2.estimateAffinePartial2D(np.float32([k1[m.queryIdx].pt for m in good]),np.float32([k2[m.trainIdx].pt for m in good]),method=cv2.RANSAC,ransacReprojThreshold=2)
    if mat is None or int(inliers.sum())<10: raise RuntimeError('Unreliable alignment '+name)
    shut=cv2.warpAffine(shut,mat,(w,h),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    # Fixed landmarks for this generated portrait; no pretrained detector or weights.
    eye_centers=[(w*.417,h*.284),(w*.596,h*.284)]
    pts=np.array([eye_centers[0]]*24+[eye_centers[1]]*24+[(w*.50,h*.41)]*60,dtype=np.float32)
    mask=np.zeros((h,w),np.uint8)
    for cx,cy in eye_centers:
        cv2.ellipse(mask,(round(cx),round(cy)),(round(w*.07),round(h*.025)),0,0,360,255,-1)
    mask=cv2.dilate(mask,np.ones((3,3),np.uint8)); mask=cv2.GaussianBlur(mask,(5,5),.8).astype(np.float32)/255
    duration=12.; fps=25; n=int(duration*fps)
    writer=cv2.VideoWriter(str(out/'source-motion.avi'),cv2.VideoWriter_fourcc(*'FFV1'),fps,(w,h))
    yy,xx=np.mgrid[:h,:w].astype(np.float32); center=pts[:48].mean(axis=0)
    neck=(w*.5,h*.55)
    # Approximate rigid head surface, soft neck joint and parent torso transform.
    q=((xx-w*.50)/(w*.37))**2+((yy-h*.31)/(h*.37))**2
    skull=np.clip(1-q,0,1)**1.5*65
    nose=22*np.exp(-(((xx-w*.50)/(w*.09))**2+((yy-h*.36)/(h*.10))**2))
    depth=skull+nose
    u=np.clip((yy-h*.48)/(h*.16),0,1)
    neck_blend=1-(u*u*(3-2*u))
    edge=np.clip(np.minimum(xx,w-1-xx)/(w*.22),0,1)
    lateral=edge*edge*(3-2*edge)
    headweight=neck_blend*lateral
    bodyweight=np.clip((yy-h*.43)/(h*.15),0,1)*np.clip(1-((xx-w*.5)/(w*.65))**4,0,1)
    subject=np.maximum(headweight,bodyweight)
    points=np.stack([xx-neck[0],yy-neck[1],depth+80],axis=-1)
    def rotation(pitch,yaw,roll):
        cx,sx=np.cos(pitch),np.sin(pitch);cy,sy=np.cos(yaw),np.sin(yaw);cz,sz=np.cos(roll),np.sin(roll)
        rx=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]])
        ry=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]])
        rz=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]])
        return (rz@ry@rx).astype(np.float32)
    blink_center=5.72; last=None
    for i in range(n):
        t=i/fps; frame=src.copy(); blink=0.
        for b in [2.12,5.72,9.4]:
            dt=t-b
            if -.20<=dt<-.04: value=.5-.5*np.cos(np.pi*(dt+.20)/.16)
            elif -.04<=dt<=.06: value=1.
            elif .06<dt<=.30: value=.5+.5*np.cos(np.pi*(dt-.06)/.24)
            else:value=0.
            blink=max(blink,value)
        # Gentle local edge enhancement; never paste a static mouth over speech.
        mouth=pts[48:108].mean(axis=0)
        local=np.exp(-(((xx-mouth[0])/(w*.14))**4+((yy-mouth[1])/(h*.12))**4))[...,None]
        detail=frame.astype(np.float32)-cv2.GaussianBlur(frame.astype(np.float32),(0,0),.8)
        frame=np.clip(frame+.55*local*detail,0,255).astype(np.uint8)
        alpha=mask[...,None]*blink
        frame=(frame*(1-alpha)+shut*alpha).astype(np.uint8)
        def pulse(start,end):
            return np.sin(np.pi*np.clip((t-start)/(end-start),0,1))**2
        agreement=pulse(1.55,2.65)+.8*pulse(8.55,9.25)+.65*pulse(9.28,10.05)
        attention=pulse(3.34,4.55)+.7*pulse(6.55,7.35)
        def lateral_gesture(start,end):
            u=np.clip((t-start)/(end-start),0,1)
            return np.sin(2*np.pi*u)*np.sin(np.pi*u)**2
        side=lateral_gesture(4.65,6.4)+.8*lateral_gesture(7.1,8.5)
        # Fixed orthographic camera: rotations only, with no scale/zoom track.
        pitch=np.deg2rad(-6.0*agreement+1.5*attention)
        yaw=np.deg2rad(6.5*side);roll=np.deg2rad(1.0*side)
        moved=points@rotation(pitch,yaw,roll).T
        head_delta=(moved-points)*headweight[...,None]
        # The spine is the parent of the neck; shoulders accompany the gesture.
        world=np.stack([xx-w*.5,yy-h*.88,depth+40],axis=-1)+head_delta
        body_delta=(world@rotation(pitch*.12,yaw*.18,roll*.2).T-world)*subject[...,None]
        delta=head_delta+body_delta
        dx,dy=delta[...,0],delta[...,1]
        # Reject any fold in the deformation rather than export doubled anatomy.
        dxx=np.gradient(dx,axis=1);dxy=np.gradient(dx,axis=0)
        dyx=np.gradient(dy,axis=1);dyy=np.gradient(dy,axis=0)
        jac=(1-dxx)*(1-dyy)-dxy*dyx
        if jac.min()<.55:raise RuntimeError('Deformation fold rejected at '+str(t)+' : '+str(float(jac.min())))
        # Invert the forward field without blending multiple rendered faces.
        mx,my=xx-dx,yy-dy
        for iteration in range(3):
            sx=cv2.remap(dx,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
            sy=cv2.remap(dy,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
            mx,my=xx-sx,yy-sy
        rendered=cv2.remap(frame,mx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
        if i==0:cv2.imwrite(str(out/'coherent-first.png'),rendered)
        writer.write(rendered)
        if i in [8,40,53,100,143,200,235]:cv2.imwrite(str(out/('coherent-'+str(i)+'.jpg')),rendered)
    writer.release()
    cv2.imwrite(str(out/'coherent-last.png'),rendered)
    final=out/'tutrice-sync-source-v1.mp4'
    run(["ffmpeg","-y","-i",str(out/"source-motion.avi"),"-an","-vf","scale=540:720:flags=lanczos,setsar=1","-c:v","libx264","-crf","16","-pix_fmt","yuv420p","-movflags","+faststart",str(final)])
    report.append({'name':name,'pose':pose,'alignment_inliers':int(inliers.sum()),'duration_seconds':duration,'frames':n,'blink_seconds':blink_center,'motion':'fixed source nods and attention gestures; not semantically aligned to new audio; single inverse remap','gestures':[{'intent':'attention','seconds':[.05,.95]},{'intent':'agreement','seconds':[1.55,2.45]},{'intent':'attention','seconds':[3.34,4.55]},{'intent':'attention','seconds':[6.55,7.35]},{'intent':'agreement','seconds':[8.55,9.95]}],'blink_duration_seconds':.50,'lateral_gesture_seconds':[[4.65,6.4],[7.1,8.5]],'camera_scale':1,'geometry':'approximate head-depth surface with parent torso and neck joint','scope':'clean portrait master; no Wav2Lip or GFPGAN output'})
    print(name,'ready',flush=True)
(out/'sync-source-verification.json').write_text(json.dumps(report,indent=2))
